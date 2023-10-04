# Blue Thread

## Disclaimer

⚠ It is in development and not very pretty yet. Some bugs are present, but a lot of improvements will come in the future. Follow [Blue Thread on Bluesky](http://bsky.app/profile/bluethread.bsky.social) for the latest news.

## What is it ?

Blue Thread is a tool to **post threads easily** on [Bluesky](https://bsky.app/).

Connect with your account, type in a text, and Blue Thread will cut it into separate posts, number them, and post the thread in the blink of an eye!

## Features

* Automatically cuts the text into 300 characters posts, by respecting the punctuation to avoid cutting sentences, when possible.
* Adds a number (1/3, 2/3, 3/3 etc.) at the end of each post.
* Sends the entire thread all at once

You can :
* Edit each post before sending the thread on Bluesky.
* Add or remove a post before sending the thread.

## Possible future features

Here is a list of possible features I'd like to add :
* Add several pictures to a post (up to 4)
* Add an alt text to each picture.
* Chose the language of the thread.
* Customize the way the thread is cut ?
* Cut the text and show you the result in real time ?

## What's the tech behind it

It's programmed in Python, and is based on the [Flask micro framework](https://flask.palletsprojects.com/en/2.3.x/) and the [jinja2 templating engine](https://jinja.palletsprojects.com/en/3.1.x/). It uses the [atproto SDK](https://atproto.blue/en/latest/) to connect to Bluesky. The client side is done in javascript vanilla.

Tested on Firefox.
