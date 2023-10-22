
/* Displays a dialog to ask the alt text and updates the input value */
var inputAlt = function (event){
    // console.log(event);
    const input = event.target;
    const old_alt_text = document.getElementById(input.id).value;  // get the previous alt value which is in the input field
    new_alt_text = prompt("Décrivez l'image :", old_alt_text);      // Prompts the user to input a new alt text
    document.getElementById(input.id).value=new_alt_text;          // Sets the input value with the new alt text
    document.getElementById(input.previousElementSibling.firstChild.id).title=new_alt_text;    // Sets the img title property which displays a tooltip over the picture
};

/* Called when a picture is added 
   It adds the picture's thumbnail, and an input field for the alt text */
var loadFile = function(event, i) {
    const tr = document.getElementById('output_table_row'+i);
    const num_image = tr.cells.length+1;
            
    const image=document.createElement("img");
    image.src = URL.createObjectURL(event.target.files[0]);
    image.id="img"+i+"_"+num_image;
    
    // Link that opens the picture in a new tab
    const lien=document.createElement("a");
    lien.href=URL.createObjectURL(event.target.files[0]);
    lien.target="_blank"
    lien.appendChild(image);
    
    const alt=document.createElement("input");
    alt.placeholder="alt";
    alt.id="alt"+i+"_"+num_image;
    alt.name="alt"+i
    alt.addEventListener("click", inputAlt);
    
    const td=document.createElement("td");
    td.appendChild(lien);
    td.appendChild(alt);
    
    tr.appendChild(td);        
    
};

/* Resizes a textarea to match the content height */
function resizeTextarea(element){
    element.style.height = "auto";
    element.style.height = element.scrollHeight-10 + "px";
    element.style.height = element.scrollHeight-10 + "px";   //  2e resize nécessaire sinon le premier textarea se met pas à la bonne taille ??
    
    /* Updating the displayed number of characters */
    var nb_char = element.value.length;
    const span_nb_char = element.parentNode.getElementsByClassName("nb_char")[0].firstChild;
    span_nb_char.innerText = nb_char;
    
    if (nb_char >= 290) {
        span_nb_char.classList.add("warning");
    }
    else{
        span_nb_char.classList.remove("warning");
    }
    
    const btn_send = document.getElementById("btn_send");
    
    if (element.value == ""){
        btn_send.disabled = true;
        btn_send.title="Aucun post ne doit être vide pour envoyer le thread";
        btn_send.classList.add("disabled");
    }
    else {
       btn_send.disabled = false;
       btn_send.title="";
       btn_send.classList.remove("disabled");
    }
    
}

function resizeText(){
    const ta = document.getElementById("ta_text");
    
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight-10 + "px";
    
}

/* Resizes all the posts textareas */
function resizePosts(){
    var ta = document.getElementById('div_posts').getElementsByTagName('textarea');
    for (let element of ta) {
      resizeTextarea(element);
    }
}

/* On body load : check dark_mode and update the posts size */
function onLoadUpdate(){
    /* Puts in dark mode if the dark mode was stored in the localStorage object */
    if (localStorage.getItem("dark_mode") == "true"){
        document.body.classList.add("dark_mode");
        document.getElementById("btn_toggle_dark_mode").innerText = "Dark mode";
    }
    else{
        document.body.classList.remove("dark_mode");
        document.getElementById("btn_toggle_dark_mode").innerText = "Light mode";
    }

    document.getElementById("ta_text").value = localStorage.getItem("text");
    
    cutThread();
    
    if (document.getElementById('div_posts')){
        resizePosts();
    }
    
    updateBtnCut()
}

function updateBtnCut(){
    const btn_cut = document.getElementById("btn_cut");
    const ta_text = document.getElementById("ta_text");
    // Only allow to click on the cut button if the text is long enough
    if (document.getElementById("ta_text")){
        if (ta_text.value.length < 300){
            btn_cut.disabled = true;
            btn_cut.classList.add("disabled");
        }
        else{
            btn_cut.disabled = false;
            btn_cut.classList.remove("disabled");
        }
    }
}

/* Adds a new post at the botom of the posts */
function addPost(element){
    /* Copy of the first div_post */
    const new_div = document.getElementById("div_post1").cloneNode(true);
    const new_ta = new_div.getElementsByClassName("ta_post").post
  //  const new_label = new_div.getElementsByTagName("label").label
    const new_input = new_div.getElementsByClassName("input_images").input_images
    const new_nb_char = new_div.getElementsByClassName("nb_char").nb_char1
    const new_thumbnail_zone = new_div.getElementsByTagName("output").thumbnail_zone1
    const new_number = document.getElementsByClassName("div_post").length+1;
    
    new_div.id="div_post"+new_number;
    
    new_ta.id = "ta_post"+new_number;
    new_ta.value="";
    
    new_input.id="input_images"+new_number;
    
    new_nb_char.id="nb_char"+new_number;
    new_nb_char.firstChild.innerText="0";
            /*
    new_thumbnail_zone.id="thumbnail_zone"+new_number;
    new_thumbnail_zone.getElementsByTagName("tr").output_table_row1.innerHTML = "";
    new_thumbnail_zone.getElementsByTagName("tr").output_table_row1.id="output_table_row"+new_number;
    */
    element.parentNode.insertBefore(new_div, document.getElementById("btn_remove_post"));

    resizeTextarea(new_ta);
    
    /* If there is only 2 posts (we just added one so there was only one before), we activate the remove button again */
    if (document.getElementsByClassName("div_post").length == 2){
        document.getElementById("btn_remove_post").hidden = false;
        document.getElementById("btn_add_post").style.marginLeft = "15px";
    }
}

/* Removes the last post of the thread */
function removePost(element){
    /* Deletes the previous post */
    element.previousElementSibling.remove();
    
    /* If there is only one post left, we hide the "remove post" button */
    if (document.getElementsByClassName("div_post").length == 1){
        element.hidden = true;
        document.getElementById("btn_add_post").style.marginLeft = "0px";
    }
    
    resizePosts();
}

/* Switches the dark_mode on or off when pressing the button */
function toggleDarkMode(){    
    if (localStorage.getItem("dark_mode")){
        document.getElementById("btn_toggle_dark_mode").innerText = "Light mode";
        localStorage.removeItem("dark_mode");
    }
    else{
        document.getElementById("btn_toggle_dark_mode").innerText = "Dark mode";
        localStorage.setItem("dark_mode", "true");
    }
    document.body.classList.toggle("dark_mode");
}

/* Gets the text from the textarea, and cuts it in several posts */
function cutThread(){
    
    /* Saving the text in the localStorage */
    const text = document.getElementById("ta_text").value;
    localStorage.setItem("text", text);
    
    btn_clear = document.getElementById("btn_clear");
    
    /* If the text is empty, disabling the clear button */
    if (text.length == 0){
        btn_clear.disabled = true;
        btn_clear.classList.add("disabled");
    }
    else{
        btn_clear.disabled = false;
        btn_clear.classList.remove("disabled");
    }
    
    const longueur = 291; // Nombre de caractères d'un post (300 moins la place pour la numérotation)
    let debut = 0; // Indice de début du post en cours
    let fin = longueur; // Indice de fin du post en cours
    const thread = new Array(); // Array contenant les posts à envoyer
    let dernier_post = false;
    let post="";
    
    while (debut < text.length - 1) {
       // console.log("debut : "+debut+", fin : "+fin);


        // Elimination des retours à la ligne en début de post
        while (text[debut] === '\n' || text[debut] === ' ') {
          debut++;
          fin++;
        }

        // Pour éviter que l'indice dépasse la fin de la chaine, pour le dernier post
        if (fin >= text.length) {
          fin = text.length - 1;
        //  console.log("Fin du texte -> nouvelle fin : "+fin+ ", len(text)="+text.length);
          dernier_post = true;
        }

        // On cherche une fin de phrase (points) entre les caractères 150 et 291
        const fin_phrase = trouverFinPhrase(text.substring(debut + 150, fin));
        if (fin_phrase !== -1 && !dernier_post) {
          fin = fin_phrase + debut + 150;
        //  console.log("Fin trouvée avec la ponctuation : "+fin);

        } else {
          // Si pas de ponctuation, si on coupe un mot en cours, on fixe la fin du post au début du mot
          while (text[fin] !== " " && text[fin+1] !== " " && fin > debut && !dernier_post) {
            fin--;
          //  console.log("Recherche début de mot : nouvelle fin = " + fin);
          }

          // Si on n'a pas réussi à trouver un début de mot, alors on le coupe à la fin
          if (fin === debut) {
           // console.log("pas trouvé de début de mot, on coupe à 291");
            fin = debut + longueur;
          }
        }


        // Création du texte du post
        post = text.substring(debut, fin + 1);

        // Ajout à l'array
        thread.push(post);

        // Calcul des variables pour le prochain post
        debut = fin + 1;
        fin += longueur;
    }

    // Ajout de la numérotation à la fin du post
    const str_nb_posts = String(thread.length);
    for (let index = 0; index < thread.length; index++) {
        const numerotation = (index + 1) + '/' + str_nb_posts;
        thread[index] = thread[index] + ' (' + numerotation + ')';
    }
    
    addPosts(thread);
}

/* Cherche la dernière fin de phrase dans la chaine en entrée
 Prend en entrée une chaine
 Retourne l'indice de la fin de phrase trouvée, -1 si pas de ponctuation trouvée
 */
function trouverFinPhrase(post) {
  const regex = /[\.?!👇🧵]\s[^\.\?!👇🧵]*$/;
  const match = post.match(regex);

  if (match) {
    return match.index;
  } else {
    return -1;
  }
}

/* Input : a thread (array of strings)
   Create the posts and add them in the html page
 */
function addPosts(thread){
    
    document.getElementById("div_posts").innerHTML="";
    
    // Iteration on the thread elements to create the posts divs, buttons etc
    thread.forEach(function (post_text, i){
        
        const new_div = document.createElement("div");
        new_div.id="div_post"+(i+1);
        new_div.classList.add("div_post");
        
        const new_ta = document.createElement("textarea");
        new_ta.id = "ta_post"+(i+1);
        new_ta.name="post";
        new_ta.value=post_text;
        new_ta.classList.add("ta_post");
        new_ta.setAttribute("maxlength", 300);
        new_ta.setAttribute("oninput", "resizeTextarea(this)");

        const new_label = document.createElement("label");
        
//      <label for="input_images{{loop.index}}"><img src="static/image_icon.png" /></label>

        const new_input = document.createElement("input");
        new_input.id="input_images"+(i+1);
        new_input.type="file";
        new_input.name="input_images";
        new_input.setAttribute("accept", "image/png, image/jpg, image/jpeg");
        new_input.setAttribute("onchange", "loadFile(event, "+i+")");
        new_input.classList.add("input_images");
        
        const new_nb_char = document.createElement("div");
        new_nb_char.id="nb_char"+(i+1);
        new_nb_char.innerHTML="<span>0</span>/300";
        new_nb_char.classList.add("nb_char");

        const new_thumbnail_zone = document.createElement("output");
        new_thumbnail_zone.id="thumbnail_zone"+(i+1);
        new_thumbnail_zone.classList.add("thumbnail_zone")
        
        // créer les lignes de la table etc
        
        new_div.appendChild(new_ta);
        new_div.appendChild(new_label);
        new_div.appendChild(new_input);
        new_div.appendChild(new_nb_char);
        new_div.appendChild(new_thumbnail_zone);
        
        document.getElementById("div_posts").appendChild(new_div);

        
    });
    
    if (thread.length > 0) {
        const btn_remove_post = document.createElement("button");
        btn_remove_post.id="btn_remove_post";
        btn_remove_post.type="button";
        btn_remove_post.title="Supprimer un post";
        btn_remove_post.setAttribute("onclick","removePost(this);");
        btn_remove_post.innerText="-";
        
        const btn_add_post = document.createElement("button");
        btn_add_post.id="btn_add_post";
        btn_add_post.type="button";
        btn_add_post.title="Ajouter un post";
        btn_add_post.setAttribute("onclick","addPost(this);");
        btn_add_post.innerText="+";
        
        const btn_send = document.createElement("input");
        btn_send.id="btn_send";
        btn_send.type="Submit";
        btn_send.name="action";
        btn_send.value="✉ Envoyer";
        btn_send.classList.add("btn");
        
        const btn_select=document.createElement("select");
        btn_select.id="select_lang";
        btn_select.name="lang";
        btn_select.classList.add("btn");
        btn_select.setAttribute("required", true);
        btn_select.title="Choisissez la langue dans laquelle est écrit le thread";
        
        btn_select.innerHTML=`<option value="">Langue</option>
                <option value="ar">🇸🇦 Arab</option>
                <option value="zh">🇨🇳 Chinese</option>
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 French</option>
                <option value="de">🇩🇪 German</option>
                <option value="it">🇮🇹 Italian</option>
                <option value="ja">🇯🇵 Japanese</option>
                <option value="po">🇵🇹 Portuguese</option>
                <option value="ru">🇷🇺 Russian</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="en">❓ Other</option>`;
       
        document.getElementById("div_posts").appendChild(btn_remove_post);
        document.getElementById("div_posts").appendChild(btn_add_post);
        document.getElementById("div_posts").appendChild(btn_send);
        document.getElementById("div_posts").appendChild(btn_select);
        
        
    }
    
    resizePosts();
    
    // console.log("fin add_posts");
}

/* Clears the text and the posts */
function clearText(){
    document.getElementById("ta_text").value = "";
    localStorage.setItem("text", "");
    cutThread();
    
}