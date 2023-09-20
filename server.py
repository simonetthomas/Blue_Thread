# TODO :
# - Message de confirmation après l'envoi du thread
# - améliorer la gestion de la session, avec des cookies etc.
# - Gérer l'envoi d'une image par post : ok
# - Afficher l'image choisie pour un post
# - Gérer l'envoi de plusieurs images par post
# - Limiter la sélection à 4 images par post
# - Gérer le découpage en JS sans formulaire ?
# - Gérer le choix de la langue d'envoi

from flask import Flask, request, render_template, redirect, flash
from atproto import Client, models
import math
import os
import argparse
import re

app = Flask(__name__)

app.config.from_pyfile('config.py')

login = ""
password=""
client = Client()

@app.route('/')
def index():
  return render_template('index.html')

@app.route("/login", methods=['GET', 'POST'])
def fctn_login():
    global login
    global password
    global client
    
    if request.method == 'POST':
        login = request.form.get('login')
        password = request.form.get('password')
        
        print (login)
        print (password)
        
        if (connexion(client, login, password) == 0):
            flash("Connexion réussie")
            return redirect('/thread/')
        else:
            error="Erreur de connexion, veuillez réessayer."
            return render_template("index.html", error=error)
    else:
        return redirect('/')

@app.route('/thread/',  methods=['GET', 'POST'])
def thread():
    print ('Entrée dans la méthode "thread"')
    text=""
    thread=[]
    disabled="disabled='true'"
    global login
    global password
    global client
    
    print("login : "+login)
    
    if login=="":
        return redirect("/login")
    
    if request.method == 'POST':
        text = request.form.get('text')
        if request.form.get('action') == "Découper le texte":
            print ('Entrée avec la méthode POST')
            
            # Récupération du texte du formulaire
            text = request.form.get('text')
            thread=decoupage(text)
            
            disabled=""
                    
        elif request.form.get('action') == "Envoyer":
            # Récupération des posts
            thread=request.form.getlist("post")
            print(thread)
            images=request.files.getlist('image')
            
            if (connexion(client, login, password) == 0):
                if (envoi_thread(thread, images, client, "fr") == 0):
                    print("Thread envoyé sur le compte bluesky de " + login + "!\n")
                else :
                    print("Erreur lors de l'envoi...")

    # Affichage de la page thread, éventuellement avec le texte s'il existe déjà
    return render_template("thread.html", text=text, thread=thread, disabled=disabled)


@app.errorhandler(404)
def page_not_found(error):
    return ('Page non trouvée :(')

  
# Parcourt le texte et le découpe en posts, puis les place dans un array
# Prend en entree le texte à découper
# Retourne un array de strings
def decoupage(text):
    longueur=292    # Nombre de caractères d'un post (300 moins la place pour la numérotation)
    debut=0         # Indice de début du post en cours
    fin=longueur    # Indice de fin du post en cours
    thread = []     # Array contenant les posts à envoyer
    
    while (debut < len(text)-1 ):
        #print ("debut : "+str(debut)+", fin : "+str(fin))
        
        # Pour éviter que l'indice dépasse la fin de la chaine, pour le dernier post
        if fin >= len(text):
            fin = len(text)-1
           # print ("nouvelle fin : "+str(fin)+ ", len(text)="+str(len(text)))
            
        # On cherche une fin de phrase (points) entre les caractères 150 et 292
        fin_phrase = trouver_fin_phrase(text[debut+150:fin])
        if (fin_phrase != -1):
            fin = fin_phrase+debut+150
        else:
            #Si pas de ponctuation, si on coupe un mot en cours, on fixe la fin du post au début du mot
            while (text[fin-1] != " " and text[fin]) != " " and fin < len(text)-1:
                fin-=1
                
        # Elimination des retours à la ligne en début de post
        while (text[debut] == '\n' or text[debut] == ' ' ):
            debut+=1
        
        # Création du texte du post
        post=text[debut:fin+1]
        print("Post : ", post)
        
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
    x = re.search("[\.?!][^\.\?!]*$", post) 
    #print(x)
    if (x) :
        return x.start()
    else:
        return -1

# Connecte le client avec les identifiants fournis
# Prend en entrée le client, un login et un password
# Retourne 0 si connexion ok, 1 sinon
def connexion(client, login, password):
    try:
        print("- Connexion...")
        client.login(login, password)
    except:
        print("Erreur de connexion. Veuillez vérifier l'identifiant et le mot de passe.")
        return 1;
    else:
        print("- Connexion ok")
        return 0;


# Poste le thread sur Bluesky
# Prend en entree un array de strings, un client et une langue
# retourne 0 si ok
def envoi_thread (thread, images, client, langue):
    premier=True
    str_nb_posts = str(len(thread))
    
    # for item in request.files.getlist('image'):
    # data = item.read()
    # print('len:', len(data))

    
    for index, post in enumerate(thread):
        numerotation = str(index+1)+"/"+str_nb_posts
        embed=''
        if (premier):
            # Envoi du premier post, qui ne fait référence à aucun post
            # print("image", images[index])
            if (images[index].filename==''):    # Si pas d'image
                print("pas d'image")
                post_ref = client.send_post(text=post, langs=[langue])

            else:   # S'il y a une image
                img_data=images[index].read()
                upload = client.com.atproto.repo.upload_blob(img_data)  # TODO tester la taille du fichier ? Apparement erreur si trop gros
                pics = [models.AppBskyEmbedImages.Image(alt='Une image', image=upload.blob)]    # TODO prendre en compte un ALT rempli par l'utilisateur
                embed = models.AppBskyEmbedImages.Main(images=pics)
                
                post_ref = client.send_post(
                    text=post, langs=[langue], embed=embed
                )
                
            premier=False
        else:
            # Envoi d'un post suivant, en réponse au précedent
            if (images[index].filename==''):    # Si pas d'image
                post_ref = client.send_post(
                    text=post, reply_to=models.AppBskyFeedPost.ReplyRef(post_ref, post_ref), langs=[langue]
                )
            else:   # S'il y a une image
                img_data=images[index].read()
                upload = client.com.atproto.repo.upload_blob(img_data)  # TODO tester la taille du fichier ? Apparement erreur si trop gros
                pics = [models.AppBskyEmbedImages.Image(alt='Une image', image=upload.blob)]    # TODO prendre en compte un ALT rempli par l'utilisateur
                embed = models.AppBskyEmbedImages.Main(images=pics)
                
                post_ref = client.send_post(
                    text=post, reply_to=models.AppBskyFeedPost.ReplyRef(post_ref, post_ref), langs=[langue], embed=embed
                )
                
        print("- Post "+numerotation+" envoyé\n")
        
    return 0


if __name__ == '__main__':
    app.run(debug=True)