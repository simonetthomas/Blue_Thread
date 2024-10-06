from flask import Flask, request, render_template, redirect, flash, session
from flask_session import Session
from atproto import Client, models
import math
import os
import argparse
import re
import requests
from typing import Dict, List

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
    langs = [request.form.get("lang")]

    print("nb posts : "+str_nb_posts)

    client = Client()
    login=session["name"]
    password=session["password"]

    print("- Envoi_thread : ", thread)
    print("form : "+str(request.form));

    if (connection(client, login, password) == 0):

        for index, post in enumerate(thread):
            #print("index : "+str(index))
            numerotation = str(index+1)+"/"+str_nb_posts

            try:    # Trying to get an alt for this post
                alts = request.form.getlist("alt"+str(index+1))
                #print("alts : ", alts)
            except Exception:
                alts = ""  # no alt for this post
                #print("pas de alt récupéré")

            #print("input_images"+str(index+1))
            images = request.files.getlist("input_images"+str(index+1))
            print(images);

            if (firstPost):
                # Sending of the first post, which doesn't reference any post

                embed_images = []
                facet = parse_facets(client, post)
                # print("facets : " + str(facet))

                # Send with embed (images)
                if (images[0].filename != ""):
                    embed_images = create_embed_images(client, images, alts, embed_images)

                    print("Premier post avec une image")
                    embed = models.AppBskyEmbedImages.Main(images=embed_images)
                    print("embed : " + str(embed))
                    root_post_ref = client.send_post(text=post, embed=embed, langs=langs, facets=facet)

                # Send without embed (images)
                else:
                    print("Premier post sans image")
                    root_post_ref = client.send_post(text=post, langs=langs, facets=facet)

                print ("root_post_ref : " + str(root_post_ref))

                parent_post_ref = root_post_ref     # The first post ref becomes the ref for the parent post
                firstPost=False
            else:
                # Sending of another post, replying to the previous one

                embed_images = []
                facet = parse_facets(client, post)
                # print("facets : " + str(facet))

                if (images[0].filename != ""):    # If there is images
                    print("Post avec images")
                    embed_images = create_embed_images(client, images, alts, embed_images)
                    embed = models.AppBskyEmbedImages.Main(images=embed_images)

                    parent_post_ref = client.send_post(text=post, reply_to=models.AppBskyFeedPost.ReplyRef(parent=models.create_strong_ref(parent_post_ref), root=models.create_strong_ref(root_post_ref)), embed=embed, langs=langs, facets=facet)
                else:   # If there is no image
                    print("Post sans image")
                    parent_post_ref = client.send_post(text=post, reply_to=models.AppBskyFeedPost.ReplyRef(parent=models.create_strong_ref(parent_post_ref), root=models.create_strong_ref(root_post_ref)), langs=langs, facets=facet)

            print("- Post "+numerotation+" envoyé")

        # Once all the thread has been sent : we get the first post's url to return it
        post_id = re.match(r"^.*\/(.*)$", root_post_ref.uri).group(1)
        post_url = "https://bsky.app/profile/"+session.get("name")+"/post/"+post_id

    else:
        print("Erreur de connexion du client lors de l'envoi...")
        flash ("connection error when trying to send...")
        post_url=-1

    return post_url


# Uploads the image blobs and returns a embed_images list
def create_embed_images(client, images, alts, embed_images) :
    # Loop over the post images to add them to the embed object
    for (image_index, image) in enumerate(images):
        print("index de l'image : "+str(image_index))
        img_data=images[image_index].read()
        #print("Juste avant ''upload_blob''")
        upload = client.com.atproto.repo.upload_blob(img_data)
        #print("Juste après ''upload_blob''")
        embed_images.append(models.AppBskyEmbedImages.Image(alt=alts[image_index], image=upload.blob))
    return embed_images


def parse_facets(client:Client, text: str) -> List[Dict]:
    """
    parses post text and returns a list of app.bsky.richtext.facet objects for any mentions (@handle.example.com) or URLs (https://example.com)

    indexing must work with UTF-8 encoded bytestring offsets, not regular unicode string offsets, to match Bluesky API expectations
    """
    facets = []
    for m in parse_mentions(text):
        try:
            resp = client.resolve_handle(m["handle"])
            print(resp)
        except Exception as error:  # if handle couldn't be resolved, just skip it! will be text in the post
            print("Error trying to resolve handle " + m["handle"] + " :", error)
            continue

        did = resp["did"]
        facets.append(
            {
                "index": {
                    "byteStart": m["start"],
                    "byteEnd": m["end"],
                },
                "features": [{"$type": "app.bsky.richtext.facet#mention", "did": did}],
            }
        )
    for u in parse_urls(text):
        facets.append(
            {
                "index": {
                    "byteStart": u["start"],
                    "byteEnd": u["end"],
                },
                "features": [
                    {
                        "$type": "app.bsky.richtext.facet#link",
                        # NOTE: URI ("I") not URL ("L")
                        "uri": u["url"],
                    }
                ],
            }
        )
    for h in parse_hashtags(text):
        facets.append(
            {
                "index": {
                    "byteStart": h["start"],
                    "byteEnd": h["end"],
                },
                "features": [
                    {
                        "$type": "app.bsky.richtext.facet#tag",
                        "tag": h["tag"],
                    }
                ],
            }
        )

    return facets


def parse_urls(text: str) -> List[Dict]:
    spans = []
    # partial/naive URL regex based on: https://stackoverflow.com/a/3809435
    # tweaked to disallow some training punctuation
    url_regex = rb"\b(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*[-a-zA-Z0-9@%_\+~#//=])?)"
    text_bytes = text.encode("UTF-8")
    for m in re.finditer(url_regex, text_bytes):
        spans.append(
            {
                "start": m.start(1),
                "end": m.end(1),
                "url": m.group(1).decode("UTF-8"),
            }
        )
    return spans

def parse_mentions(text: str) -> List[Dict]:
    spans = []
    # regex based on: https://atproto.com/specs/handle#handle-identifier-syntax
    mention_regex = rb"(@([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)"
    text_bytes = text.encode("UTF-8")
    for m in re.finditer(mention_regex, text_bytes):
        spans.append(
            {
                "start": m.start(1),
                "end": m.end(1),
                "handle": m.group(1)[1:].decode("UTF-8"),
            }
        )
    return spans

def parse_hashtags(text: str) -> List[Dict]:
    spans = []

    hashtag_regex = rb"(#[^\s]+)"
    text_bytes = text.encode("UTF-8")
    for m in re.finditer(hashtag_regex, text_bytes):
        spans.append(
            {
                "start": m.start(1),
                "end": m.end(1),
                "tag": m.group(1)[1:].decode("UTF-8").replace("/^#/", ""),
            }
        )
    return spans

if __name__ == '__main__':
    app.run(debug=True)
