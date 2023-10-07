from flask import Flask, request, render_template, redirect, flash, session
from flask_session import Session
from atproto import Client, models
import math
import os
import argparse
import re

app = Flask(__name__)
app.config.from_pyfile('config.py')
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_USE_SIGNER"] = "True"
Session(app)

client = Client()
profile = None  # Permet de garder les infos du profil bluesky

@app.route('/')
def index():
    print('/')
    if not session.get("name"):
        print("Utilisateur non connecté, chargement de la page de connexion")
        return render_template('index.html')
    else:
        print("Déjà connecté, on va sur /thread")
        return redirect('/thread')

@app.route("/login", methods=['GET', 'POST'])
def fctn_login():
    global client
    global profile

    print ("/login")
    if request.method == 'POST':
        login = request.form.get('login')
        password = request.form.get('password')

        if (connexion(client, login, password) == 0):
            session["name"] = request.form.get('login')
            return redirect('/thread')
        else:
            error="Erreur de connexion, veuillez vérifier l'identifiant et le mot de passe."
            session["name"] = None
            return render_template("index.html", error=error)

    elif request.method == 'GET':
        if not session.get("name"):
            print("Utilisateur non connecté, redirection vers la page de connexion")
            return redirect('/')
        else:
            print("Déjà connecté, on va sur /thread")
            return redirect('/thread')

    # Au cas ou
    return redirect('/')

@app.route("/logout", methods=['GET'])
def logout():
    global profile

    print("- Déconnexion")
    profile = None;
    session["name"] = None
    return redirect('/')


@app.route('/thread',  methods=['GET', 'POST'])
def thread():
    print ('/thread')
    text=""
    thread=[]
    disabled="disabled='true'"
    global client
    global profile

    if not session.get("name"):
        print("Utilisateur non connecté, redirection vers la page de connexion")
        return redirect("/")

    if request.method == 'POST':
        print ('Entrée avec la méthode POST')
        text = request.form.get('text')
        if request.form.get('action') == "Découper le texte":
            print("- Decoupage du texte")
            # Récupération du texte du formulaire
            text = request.form.get('text')
            try:
                thread=decoupage(text)
            except Exception as error:
                print("Erreur lors du découpage du texte : ", error)
                flash ("Erreur lors du découpage");
            else:
                disabled=""

        elif request.form.get('action') == "Envoyer":
            print("- Envoi du thread")
            # Récupération des posts
            thread=request.form.getlist("post")
            print(thread)
            images=request.files.getlist('input_images')
            #alts=request.form.getlist("alt")
            #print("alts : ", alts)

            if (profile is not None):   # Si le client a bien une connexion valide à Bluesky
                if (envoi_thread(thread, images, request.form, client) == 0):
                    print("Thread envoyé sur le compte bluesky de " + profile.handle + "!\n")
                    return render_template('thread_sent.html')
                else :
                    print("Erreur lors de l'envoi...")
            else:
                print("Utilisateur non connecté, envoi impossible")
                flash ("Utilisateur non connecté, envoi impossible. Veuillez vous connecter à nouveau.")

    # Affichage de la page thread, éventuellement avec le texte s'il existe déjà
    return render_template("thread.html", text=text, thread=thread, disabled=disabled)


@app.errorhandler(404)
def page_not_found(error):
    return ('Page non trouvée :(')


# Parcourt le texte et le découpe en posts, puis les place dans un array
# Prend en entree le texte à découper
# Retourne un array de strings
def decoupage(text):
    longueur=291    # Nombre de caractères d'un post (300 moins la place pour la numérotation)
    debut=0         # Indice de début du post en cours
    fin=longueur    # Indice de fin du post en cours
    thread = []     # Array contenant les posts à envoyer
    dernier_post=False

    while (debut < len(text)-1 ):
        #print ("debut : "+str(debut)+", fin : "+str(fin))

        # Pour éviter que l'indice dépasse la fin de la chaine, pour le dernier post
        if fin >= len(text):
            fin = len(text)-1
            #print ("Fin du texte -> nouvelle fin : "+str(fin)+ ", len(text)="+str(len(text)))
            dernier_post=True

        # On cherche une fin de phrase (points) entre les caractères 150 et 291
        fin_phrase = trouver_fin_phrase(text[debut+150:fin])
        if (fin_phrase != -1 and not dernier_post):
            fin = fin_phrase+debut+150
            #print("Fin trouvée avec la ponctuation : " + str(fin))
        else:
            # Si pas de ponctuation, si on coupe un mot en cours, on fixe la fin du post au début du mot
            while (text[fin-1] != " " and text[fin]) != " " and fin > debut and not dernier_post:
                fin-=1
                #print ("Recherche début de mot : nouvelle fin = " + str(fin));
                
            # Si on n'a pas réussi à trouver un début de mot, alors on le coupe à la fin
            if (fin == debut):
                #print("pas trouvé de début de mot, on coupe à 291")
                fin = debut+longueur

        # Elimination des retours à la ligne en début de post
        while (text[debut] == '\n' or text[debut] == ' ' ):
            debut+=1

        # Création du texte du post
        post=text[debut:fin+1]
        #print("Post : ", post)

        # Ajout à l'array
        thread.append(post)

        # Calcul des variables pour le prochain post
        debut=fin+1
        fin+=longueur

    # Ajout de la numérotation à la fin du post
    str_nb_posts = str(len(thread))
    for index, post in enumerate(thread):
        numerotation = str(index+1)+"/"+str_nb_posts
        thread[index]=post+" ("+numerotation+")"


    return (thread)

# Cherche la dernière fin de phrase dans la chaine en entrée
# Prend en entrée une chaine
# Retourne l'indice de la fin de phrase trouvée, -1 si pas de ponctuation trouvée
def trouver_fin_phrase(post):
    x = re.search("[\.?!👇🧵]\s[^\.\?!👇🧵]*$", post)
    #print(x)
    if (x) :
        return x.start()
    else:
        return -1

# Connecte le client avec les identifiants fournis
# Prend en entrée le client, un login et un password
# Retourne 0 si connexion ok, 1 sinon
def connexion(client, login, password):
    global profile
    try:
        print("- Connexion...")
        profile = client.login(login, password)
    except Exception as error:
        print("Erreur de connexion. Veuillez vérifier l'identifiant et le mot de passe.", type(error).__name__, error)
        profile = None;
        return 1;
    else:
        print("- Connecté en tant que "+profile.handle)
        return 0;


# Poste le thread sur Bluesky
# Prend en entree un array de strings, des images, les valeurs du formulaire et un client
# retourne 0 si ok
def envoi_thread (thread, images, form, client):
    premier=True
    str_nb_posts = str(len(thread))
    langue = form.get("lang")
    
    print("Envoi_thread")

    for index, post in enumerate(thread):
        numerotation = str(index+1)+"/"+str_nb_posts
        embed=''
        
        try:    # Essai de recupation d'un alt pour ce post
            alt = form.get("alt"+str(index+1))
        except Exception:
            alt = ""  # no alt for this post
            #print("pas de alt récupéré")
        
        if (premier):
            # Envoi du premier post, qui ne fait référence à aucun post
            # print("image", images[index])
            if (images[index].filename==''):    # Si pas d'image
                #print("pas d'image")
                root_post_ref = models.create_strong_ref(client.send_post(text=post, langs=[langue]))

            else:   # S'il y a une image
                print("Premier post avec une image")
                img_data=images[index].read()
                print("Juste avant ''upload_blob''")
                upload = client.com.atproto.repo.upload_blob(img_data)
                print("Juste après ''upload_blob''")
                pics = [models.AppBskyEmbedImages.Image(alt=alt, image=upload.blob)]
                embed = models.AppBskyEmbedImages.Main(images=pics)
                
                root_post_ref = models.create_strong_ref(client.send_post(
                    text=post, langs=[langue], embed=embed
                ))
                                        
            parent_post_ref = root_post_ref     # Le premier post devient la ref du post parent
            premier=False
        else:
            # Envoi d'un post suivant, en réponse au précedent
            if (images[index].filename==''):    # Si pas d'image
                parent_post_ref = models.create_strong_ref(client.send_post(
                    text=post, reply_to=models.AppBskyFeedPost.ReplyRef(parent=parent_post_ref, root=root_post_ref), langs=[langue]
                ))
            else:   # S'il y a une image
                img_data=images[index].read()
                upload = client.com.atproto.repo.upload_blob(img_data)
                pics = [models.AppBskyEmbedImages.Image(alt=alt, image=upload.blob)]
                embed = models.AppBskyEmbedImages.Main(images=pics)
                
                parent_post_ref = models.create_strong_ref(client.send_post(
                    text=post, reply_to=models.AppBskyFeedPost.ReplyRef(parent=parent_post_ref, root=root_post_ref), langs=[langue], embed=embed
                ))
                
        print("- Post "+numerotation+" envoyé\n")

    return 0


if __name__ == '__main__':
    app.run(debug=True)