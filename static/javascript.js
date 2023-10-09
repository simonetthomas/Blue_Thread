

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

/* Resizes a textarea to matchy the content height */
function resizeTextarea(element){
    element.style.height = "auto";
    element.style.height = element.scrollHeight-10 + "px";
    
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
    }
    else {
       btn_send.disabled = false;
       btn_send.title="";
    }
    
}

/* Resizes all the posts textareas */
function resizePosts(){
    var ta = document.getElementById('form_posts').getElementsByTagName('textarea');
    var i = 1;
    for (let element of ta) {
      resizeTextarea(element);
      i=i+1;
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
    new_ta.innerText="";
    
    new_input.id="input_images"+new_number;
    
    new_nb_char.id="nb_char"+new_number;
    new_nb_char.firstChild.innerText="0";
            
    new_thumbnail_zone.id="thumbnail_zone"+new_number;
    new_thumbnail_zone.getElementsByTagName("tr").output_table_row1.innerHTML = "";
    new_thumbnail_zone.getElementsByTagName("tr").output_table_row1.id="output_table_row"+new_number;
    
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
