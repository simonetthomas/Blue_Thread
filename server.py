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
    client = Client()

    print ("/login")
    if request.method == 'POST':
        login = request.form.get('login')
        password = request.form.get('password')

        if (connexion(client, login, password) == 0):
            return redirect('/thread')
        else:
            error="Erreur de connexion, veuillez vérifier l'identifiant et le mot de passe."
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
    print("- Déconnexion")
    session["name"] = None
    session["password"] = None
    session["profile"] = None
    return redirect('/')


@app.route('/thread',  methods=['GET', 'POST'])
def thread():
    print ('/thread')
    thread=[]
    disabled="disabled='true'"

    if not session.get("name"):
        print("Utilisateur non connecté, redirection vers la page de connexion")
        return redirect("/")

    if request.method == 'POST':
        print ('Entrée avec la méthode POST')

        print("- Envoi du thread")
        # Récupération des posts
        thread=request.form.getlist("post")
        # print(thread)
        images=request.files.getlist('input_images')
        #alts=request.form.getlist("alt")
        #print("alts : ", alts)

        if (session.get("profile") is not None):   # Si le client a bien une connexion valide à Bluesky
            if (envoi_thread(thread, images, request.form) == 0):
                print("Thread envoyé sur le compte bluesky de " + session.get("name") + " !")
                return render_template('thread_sent.html')
            else :
                print("Erreur lors de l'envoi...")
                flash ("Erreur lors de l'envoi")
        else:
            print("Utilisateur non connecté, envoi impossible")
            flash ("Utilisateur non connecté, envoi impossible. Veuillez vous connecter à nouveau.")

    # Affichage de la page thread
    return render_template("thread.html")


@app.errorhandler(404)
def page_not_found(error):
    return ('Page non trouvée :(')


# Connecte le client avec les identifiants fournis
# Prend en entrée le client, un login et un password
# Retourne 0 si connexion ok, 1 sinon
def connexion(client, login, password):
    try:
        print("- Connexion...")
        profile = client.login(login, password)
        session["profile"] = profile    # Permet de garder les infos du profil bluesky
        session["name"] = login
        session["password"] = password
    except Exception as error:
        print("Erreur de connexion. Veuillez vérifier l'identifiant et le mot de passe.", type(error).__name__, error)
        session["profile"] = None
        session["name"] = None
        session["password"] = None
        return 1;
    else:
        print("- Connecté en tant que "+session.get("profile").handle)
        return 0;


# Poste le thread sur Bluesky
# Prend en entree un array de strings, des images, les valeurs du formulaire et un client
# retourne 0 si ok
def envoi_thread (thread, images, form):
    premier=True
    str_nb_posts = str(len(thread))
    langue = form.get("lang")
    
    client = Client()
    login=session["name"]
    password=session["password"]
    
    print("- Envoi_thread : ", thread)
    
    if (connexion(client, login, password) == 0):

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
                    
            print("- Post "+numerotation+" envoyé")
            
    else:
        print("Erreur de connexion du client lors de l'envoi...")
        flash ("Erreur de connexion du client lors de l'envoi...")

    return 0


if __name__ == '__main__':
    app.run(debug=True)