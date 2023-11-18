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

        if (connection(client, login, password) == 0):
            return redirect('/thread')
        else:
            error="Connection error, please check the login and password."
            return render_template("index.html", error=error)

    elif request.method == 'GET':
        if not session.get("name"):
            print("Utilisateur non connecté, redirection vers la page de connexion")
            return redirect('/')
        else:
            print("Déjà connecté, on va sur /thread")
            return redirect('/thread')

    # Just in case
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

    if not session.get("name"):
        print("Utilisateur non connecté, redirection vers la page de connexion")
        return redirect("/")

    if request.method == 'POST':
        print ('Entrée avec la méthode POST')

        print("- Envoi du thread")
        # Getting the posts
        thread=request.form.getlist("post")
        print(thread)

        if (session.get("profile") is not None):   # If the client has a valid connection to Bluesky
            post_url=send_thread(thread, request)
            if (post_url != -1):
                print("Thread envoyé sur le compte bluesky de " + session.get("name") + " !")
                #return render_template('thread_sent.html', post_url=post_url)
                return {"status" : 200, "name" : session.get("name"), "url" : post_url};
            else :
                print("Erreur lors de l'envoi...")
                flash ("Error when sending the thread...")
                return {"status" : 500};
        else:
            print("Utilisateur non connecté, envoi impossible")
            flash ("User not logged in, the thread could not be sent. Please log in again.")

    # Affichage de la page thread
    return render_template("thread.html")


@app.errorhandler(404)
def page_not_found(error):
    return ('Page not found :(')


# Connects the client using the login and password
# Input : client, login, password
# Returns 0 if connection ok, else returns 1
def connection(client, login, password):
    try:
        print("- Connexion...")
        profile = client.login(login, password)
        session["profile"] = profile    # Keeps the infos of the Bluesky profile
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


# Posts the thread on Bluesky
# Input : array of strings, images, form
# Returns the thread first post's url if ok, else returns -1
def send_thread (thread, request):
    firstPost=True
    str_nb_posts = str(len(thread))
    langs = request.form.get("lang")
    
    print("nb posts : "+str_nb_posts)
           
    client = Client()
    login=session["name"]
    password=session["password"]
    
    print("- Envoi_thread : ", thread)
    print("form : "+str(request.form));
    
    if (connection(client, login, password) == 0):

        for index, post in enumerate(thread):
            print("index : "+str(index))
            numerotation = str(index+1)+"/"+str_nb_posts
            embed=''
            
            try:    # Trying to get an alt for this post
                alts = request.form.getlist("alt"+str(index+1))
                print("alts : ", alts)
            except Exception:
                alts = ""  # no alt for this post
                print("pas de alt récupéré")
            
            print("input_images"+str(index+1))
            images = request.files.getlist("input_images"+str(index+1))
            
            if (firstPost):
                # Sending of the first post, which doesn't reference any post
                if (images[0].filename == ""):
                    print("pas d'image pour ce post")
                    root_post_ref = models.create_strong_ref(client.send_post(text=post, langs=[langs]))

                else:   # If there is an image
                    print("Premier post avec une image")
                    pics = []
                    # Loop over the post images to add them to the embed object
                    for (image_index, image) in enumerate(images):
                        print("index de l'image : "+str(image_index))
                        img_data=images[image_index].read()
                        print("Juste avant ''upload_blob''")
                        upload = client.com.atproto.repo.upload_blob(img_data)
                        print("Juste après ''upload_blob''")
                        pics.append(models.AppBskyEmbedImages.Image(alt=alts[image_index], image=upload.blob))
                        
                    print(str(embed))
                    embed = models.AppBskyEmbedImages.Main(images=pics)
                    root_post_ref = models.create_strong_ref(client.send_post(
                        text=post, langs=[langs], embed=embed
                    ))
                                            
                parent_post_ref = root_post_ref     # The first post ref becomes the ref for the parent post
                firstPost=False
            else:
                # Sending of another post, replying to the previous one
                if (images[0].filename == ""):    # If no image
                    parent_post_ref = models.create_strong_ref(client.send_post(
                        text=post, reply_to=models.AppBskyFeedPost.ReplyRef(parent=parent_post_ref, root=root_post_ref), langs=[langs]
                    ))
                else:   # If there is an image
                
                    pics = []
                    for (image_index, image) in enumerate(images):
                        print("index de l'image : "+str(image_index))
                        img_data=images[image_index].read()
                        print("Juste avant ''upload_blob''")
                        upload = client.com.atproto.repo.upload_blob(img_data)
                        print("Juste après ''upload_blob''")
                        pics.append(models.AppBskyEmbedImages.Image(alt=alts[image_index], image=upload.blob))
                        
                    embed = models.AppBskyEmbedImages.Main(images=pics)
                    
                    parent_post_ref = models.create_strong_ref(client.send_post(
                        text=post, reply_to=models.AppBskyFeedPost.ReplyRef(parent=parent_post_ref, root=root_post_ref), langs=[langs], embed=embed
                    ))
                    
            print("- Post "+numerotation+" envoyé")
        
        # Once all the thread has been sent : we get the first post's url to return it
        post_id = re.match(r"^.*\/(.*)$", root_post_ref.uri).group(1)
        post_url = "https://bsky.app/profile/"+session.get("name")+"/post/"+post_id

    else:
        print("Erreur de connexion du client lors de l'envoi...")
        flash ("connection error when trying to send...")
        post_url=-1

    return post_url


if __name__ == '__main__':
    app.run(debug=True)