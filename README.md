# Blue Thread 🧵

## Disclaimer

⚠ It is in development. Some bugs can be present, but a lot of improvements are coming. Follow [Blue Thread on Bluesky](http://bsky.app/profile/bluethread.bsky.social) for the latest news.

## What is it ?

Blue Thread is a tool to **post threads easily** on [Bluesky](https://bsky.app/).

Connect with your account, type in a text, and Blue Thread will cut it into separate posts, number them, and post the thread in the blink of an eye!

![Blue Thread diagramme](https://github.com/simonetthomas/Blue_Thread/assets/36693311/d8992581-17d7-4f35-af33-3030d3453dae)


## Features

* Automatically cuts the text into 300 characters posts as you type it, by respecting the punctuation to avoid cutting sentences when possible.
* Adds a number (1/3, 2/3, 3/3 etc.) at the end of each post.
* Creates links from urls, and mentions to users.
* Sends the entire thread all at once on your account.

You can :
* Edit each post, and manually add or remove posts before sending the thread on Bluesky.
* Add up to 4 pictures to a post, with an alt text for each picture.
* Choose the language of the thread.
* Choose whether you want to number the posts or not.

## Possible future features

Here is a list of possible features that are not ready yet :
* Add a way to cut the thread manually at a certain point in the text.
* Deal with gif/videos

## What's the tech behind it

The server is developped in Python, and is based on the [Flask micro framework](https://flask.palletsprojects.com/en/2.3.x/) and the [jinja2 templating engine](https://jinja.palletsprojects.com/en/3.1.x/). It uses the [atproto SDK](https://atproto.blue/en/latest/) to connect to Bluesky. The client side is done in Javascript vanilla.

Tested mainly on Firefox.
