var nb_images_total=0;
var warned = false;

/* Displays a dialog to ask the alt text and updates the input value */
var inputAlt = function (i, j){
    const img_src = document.getElementById("img"+i+"_"+j).src;
    
    document.getElementById("modal_image").showModal();
    
    document.getElementById("ta_alt").value = document.getElementById("alt"+i+"_"+j).value; // get the previous alt value which is in the input field
    document.getElementById("img_modal").src=img_src;
    document.getElementById("btn_modal_validate").setAttribute("onclick", "validateModalImage("+i+", "+j+")");
    document.getElementById("btn_modal_cancel").setAttribute("onclick", "cancelModalImage("+i+", "+j+")");
    document.getElementById("btn_close_modal_image").setAttribute("onclick", "cancelModalImage("+i+", "+j+")");
    
    // Link that opens the picture in a new tab
    document.getElementById("link_image_modal").href=img_src;
    document.getElementById("link_image_modal").target="_blank"

};

/* Closes the modal that asks for the alt text */
function cancelModalImage(i, j){
    document.getElementById("modal_image").close();    
}

/* Takes the alt value of the modal and puts it into the input for the right image */
function validateModalImage(i, j){
    document.getElementById("alt"+i+"_"+j).value = document.getElementById("ta_alt").value;
    document.getElementById("modal_image").close();    
}


/* Called when a picture is added 
   It adds the picture's thumbnail, and an input field for the alt text */
var loadFile = function(event, i) {
    const tr = document.getElementById('output_table_row'+i);
    const num_image = tr.cells.length+1;
            
    const fileInput = document.getElementById("input_images"+i);    // The input elements that contains the selected files
    
    const dataTransfer = new DataTransfer();    // to store temporarily the valid files that will be added to the input
    files = event.target.files ;
        
    document.getElementById("output_table_row"+i).innerHTML="";
    
    const maxSize = 1000000;    // Max size of a file (976 KB)
    var filesTooBig = 0;        // Number of files rejected because they exceed the max size
    
    /* Adds only the 4 first files to the input and to the thumbnail zone */
    for (var j = 0; j < files.length && j <= 3+filesTooBig ; ++j) {
        
        /* If the file is not too big, we add it */
        if (files[j].size <= maxSize ){
            
            dataTransfer.items.add(files[j]);
            
            const image=document.createElement("img");
            image.src = URL.createObjectURL(files[j]);
            image.id="img"+i+"_"+(j+1);
                        
            const btn_alt=document.createElement("span");
            btn_alt.innerText="ALT";
            btn_alt.classList.add("btn_alt");
            btn_alt.setAttribute("onclick", "inputAlt("+i+","+(j+1)+")");
            btn_alt.setAttribute("tabindex", 0);
            
            const remove_picture=document.createElement("span");
            remove_picture.innerText="×";
            remove_picture.classList.add("remove_picture");
            remove_picture.setAttribute("onclick", "removeImage("+i+","+(j+1)+")");
            
            const alt=document.createElement("input");
            alt.id="alt"+i+"_"+(j+1);
            alt.name="alt"+i;
            alt.style.display = "none";
            
            const td=document.createElement("td");
            td.appendChild(image);
            td.appendChild(btn_alt);
            td.appendChild(remove_picture);
            td.appendChild(alt);
            tr.appendChild(td);
            
            nb_images_total+=1;
        }
        else{
            filesTooBig += 1;
        }
    }
  
    if (filesTooBig > 0){
        alert ("The pictures must be less than 976 KB. The bigger files have not been added.")
    }
  
    fileInput.files = dataTransfer.files;   // This affects the manipulated filelist to the input element
    
};

/* Removes an image from the thumbnail zone and input list */
function removeImage(i, j){
    
    td = document.getElementById("img"+i+"_"+j).parentNode;  // selects the td element that contains the img
    cell_index = td.cellIndex;
    
    const fileInput = document.getElementById("input_images"+i);    // The input element that contains the selected files
    const dataTransfer = new DataTransfer();
    
    for (var index = 0 ; index < fileInput.files.length ; ++index){
        if (index != cell_index){
            dataTransfer.items.add(fileInput.files[index]);     // Adding all the files except the one we want to remove
        }        
    }
    
    /* Removes the td after the transition has ended */
    td.addEventListener("transitionend", () => {
        td.remove();
    });
    
    td.classList.add("shrink");    /* Add the 'removed' class which triggers the transition to shrink the td */
    
    //console.log(dataTransfer);
    fileInput.files = dataTransfer.files;
    
    nb_images_total-=1;
    
}

/* Resizes a textarea to match the content height */
function resizeTextarea(element){
    element.style.height = "auto";
    element.style.height = element.scrollHeight-10 + "px";
    element.style.height = element.scrollHeight-10 + "px";   //  2e resize necessary or else the first textarea is not at the right size ??
    
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
}

/* Checks if the thread is valid before activating the send button :
    - All posts must be non-empty
    - A language must be selected */
function checkThreadValidity(){
    const btn_send = document.getElementById("btn_send");
    valid_thread = 1;
    ta_posts = document.querySelectorAll(".ta_post");
    
    /* Loop over every post textarea, and if one is empty, the send button is disabled. */
    try{
        ta_posts.forEach ( function (ta) { 
            if (ta.value==""){
                btn_send.disabled = true;
                btn_send.title="None of the posts must be empty to send the thread";
                btn_send.classList.add("disabled");
                valid_thread = 0;
                throw BreakException;
            }
        });
    } catch(e){ /* Breaking out of the loop */ }
    
    if (valid_thread){
        if (document.getElementById("select_lang").value != ""){
            btn_send.disabled = false;
            btn_send.title="";
            btn_send.classList.remove("disabled");
        }
        else{
            btn_send.disabled = true;
            btn_send.title="Select a language";
            btn_send.classList.add("disabled");
        }
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
    checkThreadValidity();
}

/* On body load : check dark_mode, get the text back, cut the thread, and populate the languages list */
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
    
    // Puts the last saved test in the textarea
    if(document.getElementById("ta_text")){
        document.getElementById("ta_text").value = localStorage.getItem("text");
        cutThread();
    }
    
    populateLanguages();
    
}


/* Adds a new post at the bottom of the posts */
function addPost(element){
    /* Copy of the first div_post */
    const new_div = document.getElementById("div_post1").cloneNode(true);
    const new_ta = new_div.getElementsByClassName("ta_post").post;
    const new_label = new_div.getElementsByTagName("label")[0];
    const new_input = new_div.getElementsByClassName("input_images").input_images1;
    const new_nb_char = new_div.getElementsByClassName("nb_char").nb_char1;
    const new_thumbnail_zone = new_div.getElementsByTagName("output").thumbnail_zone1;
    const new_number = document.getElementsByClassName("div_post").length+1;
    
    new_div.id="div_post"+new_number;
    
    new_ta.id = "ta_post"+new_number;
    new_ta.value="";
    
    new_label.setAttribute("for", "input_images"+new_number);
    
    new_input.id="input_images"+new_number;
    new_input.name="input_images"+new_number;
    new_input.setAttribute("onchange", "loadFile(event, "+(new_number)+")");
    new_input.value= null;
    
    new_nb_char.id="nb_char"+new_number;
    new_nb_char.firstChild.innerText="0";
            
    new_thumbnail_zone.id="thumbnail_zone"+new_number;
    new_thumbnail_zone.getElementsByTagName("tr").output_table_row1.innerHTML = "";
    new_thumbnail_zone.getElementsByTagName("tr").output_table_row1.id="output_table_row"+new_number;
    
    
    div_posts = document.querySelectorAll(".div_post");
    last_div = div_posts[div_posts.length-1];
    document.getElementById("div_posts").insertBefore(new_div, last_div.nextSibling);

    resizePosts();
    
    /* If there is only 2 posts (we just added one so there was only one before), we activate the remove button again */
    if (document.getElementsByClassName("div_post").length == 2){
        document.getElementById("btn_remove_post").hidden = false;
    }
}

/* Removes the last post of the thread */
function removePost(element){
    /* Deletes the previous post */
    document.querySelector('.div_post:last-of-type').remove();
    
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
    
    const numbering = document.getElementById("numbering").value;
    
    length = 299;
    if (numbering == "slash"){
        length = 291; // Number of characters of a post (300 minus space for the number)
    }
    
    let start = 0; // Start index of the current post
    let end = length; // End index of the current post
    const thread = new Array(); // Array containing the posts to send
    let last_post = false;
    let post="";
    
    while (start < text.length - 1) {
       // console.log("debut : "+start+", fin : "+end);


        // Elimination des retours à la ligne en début de post
        while (text[start] === '\n' || text[start] === ' ') {
          start++;
          end++;
        }

        // To avoid the index to exceed the text end, for the last post
        if (end >= text.length) {
          end = text.length - 1;
        //  console.log("Fin du texte -> nouvelle fin : "+end+ ", len(text)="+text.length);
          last_post = true;
        }

        // Searching for a sentence ending (punctuation) between characters 150 and 291
        const end_sentence = findSentenceEnd(text.substring(start + 150, end));
        if (end_sentence !== -1 && !last_post) {
          end = end_sentence + start + 150;
        //  console.log("Fin trouvée avec la ponctuation : "+end);

        } else {
          // If no punctuation found, if we are inside a word, we set the post end to the word's beginning
          while (text[end] !== " " && text[end+1] !== " " && end > start && !last_post) {
            end--;
          //  console.log("Recherche début de mot : nouvelle fin = " + end);
          }

          // If we didn't succeed to find a word's beginning, then we cut it at the end
          if (end === start) {
           // console.log("pas trouvé de début de mot, on coupe à 291");
            end = start + length;
          }
        }


        // Creation of the post's text
        post = text.substring(start, end + 1);

        // Adding the post to the array
        thread.push(post);

        // Updating the variables for the next post
        start = end + 1;
        end += length;
    }

    // Adding the numbering to the post's end
    if (numbering == "slash"){
        const str_nb_posts = String(thread.length);
        for (let index = 0; index < thread.length; index++) {
            const numbering = (index + 1) + '/' + str_nb_posts;
            thread[index] = thread[index] + ' (' + numbering + ')';
        }
    }
    addPosts(thread);
}

/* Searches for the latest sentence's ending in the input string
 Input : a string
 Returns the index of the found sentence ending, or -1 if no punctuation found
 */
function findSentenceEnd(post) {
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
    nb_images_total = 0;
    
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
        new_ta.setAttribute("oninput", "resizeTextarea(this); checkThreadValidity();");

        const new_label = document.createElement("label");
        new_label.title="Add a picture to the post";
        new_label.setAttribute("for", "input_images"+(i+1));

        const new_input = document.createElement("input");
        new_input.id="input_images"+(i+1);
        new_input.type="file";
        new_input.name="input_images"+(i+1);
        new_input.setAttribute("accept", "image/png, image/jpg, image/jpeg");
        new_input.setAttribute("onchange", "loadFile(event, "+(i+1)+")");
        new_input.classList.add("input_images");
        new_input.setAttribute("multiple", "");
        
        const new_nb_char = document.createElement("div");
        new_nb_char.id="nb_char"+(i+1);
        new_nb_char.innerHTML="<span>0</span>/300";
        new_nb_char.classList.add("nb_char");

        const new_thumbnail_zone = document.createElement("output");
        new_thumbnail_zone.id="thumbnail_zone"+(i+1);
        new_thumbnail_zone.classList.add("thumbnail_zone")
        
        // create the table rows etc.
        const new_table=document.createElement("table");
        
        const new_table_row = document.createElement("tr");
        new_table_row.id="output_table_row"+(i+1);
        
        new_table.appendChild(new_table_row);
        new_thumbnail_zone.appendChild(new_table);
        
        new_div.appendChild(new_ta);
        new_div.appendChild(new_label);
        new_div.appendChild(new_input);
        new_div.appendChild(new_nb_char);
        new_div.appendChild(new_label);
        new_div.appendChild(new_input);
        new_div.appendChild(new_thumbnail_zone);
        
        document.getElementById("div_posts").appendChild(new_div);

        
    });
    

    if (thread.length > 0) {    // If there is at least 1 post, the buttons are displayed        
        document.getElementById("btn_remove_post").removeAttribute("hidden");
        document.getElementById("btn_add_post").removeAttribute("hidden");
        document.getElementById("select_lang").removeAttribute("hidden");
        document.getElementById("btn_send").removeAttribute("hidden");
        if(document.querySelector(".ts-wrapper") != null){
            document.querySelector(".ts-wrapper").removeAttribute("hidden");
        }
        
        if (thread.length == 1) {   // If there is only 1 post, no need to display the remove button
            document.getElementById("btn_remove_post").setAttribute("hidden", "true");
        }
        else {
            document.getElementById("btn_remove_post").removeAttribute("hidden");
        }
    
    }
    else{       // If there is no post, the buttons are hidden
        document.getElementById("btn_remove_post").setAttribute("hidden", "true");
        document.getElementById("btn_add_post").setAttribute("hidden", "true");
        document.getElementById("select_lang").setAttribute("hidden", "true");
        document.getElementById("btn_send").setAttribute("hidden", "true");
        if(document.querySelector(".ts-wrapper") != null){
            document.querySelector(".ts-wrapper").setAttribute("hidden", "true");
        }
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

/* populates the languages list from a json file */
function populateLanguages(){
    select_lang = document.getElementById("select_lang");
    fetch('../static/languages.json')
    .then((response) => response.json())
    .then((json) => {
        for (let lang in json){
            select_lang.innerHTML+="<option value=\""+lang+"\">"+json[lang]+"</option>";
        }
        
        // Use Tom Select to transform the basic language <select> to a nice one
        new TomSelect("#select_lang",{
            create: false,
            maxOptions:null
        });
        if (document.getElementById("div_posts").children.length == 0) {    // If there is no post, the languages button is hidden
            document.querySelector(".ts-wrapper").setAttribute("hidden", true);
        }
    }
    );
    
}

/* When the user clicks on the "send" button
   The thread is sent via Ajax to stay on the same page */
function clickSend(){
    initializeModal();
    document.getElementById("modal_sending").showModal();
    
    ta_posts.forEach ( function (ta) { 
            if (ta.value==""){
                btn_send.disabled = true;
                btn_send.title="None of the posts must be empty to send the thread";
                btn_send.classList.add("disabled");
                valid_thread = 0;
                throw BreakException;
            }
        });
    
    my_form = document.getElementById("form_posts");
    const formData = new FormData(my_form);
    
    // console.log(formData);
    
    /* Fetch does a request to the server in ajax, and waits for a response */
    fetch("", {
        method: 'post',
        body: formData,
        headers: {}
    }).then((response) => {
        //console.log(response);
        if (response.status != "200"){
            document.getElementById("sending_state").textContent = "Error 😞";
            document.getElementById("output").innerHTML="<p>Please try again or contact <a href='https://bsky.app/profile/bluethread.bsky.social'>@BlueThread</a> if it happens again</p>";
        }
        return response.json()
    }).then((res) => {
        //console.log(res);
        document.getElementById("modal_sending").showModal(); // in case the modal has been closed before the response if received
        if (res.status == 200) {
            //console.log("Thread successfully posted!");
            document.getElementById("sending_state").textContent = "The thread has been successfully sent on "+res.name+"'s account! 😊";
            document.getElementById("btn_modal_back").style.display="";
            document.getElementById("output").innerHTML="<p><a href='"+res.url+"' target='_blank'>🧵 Open the thread in a new tab</a></p>";
        }
        else{
            console.log(res);
            document.getElementById("sending_state").textContent = "Error 😞";
            document.getElementById("output").innerHTML="<p>Please try again or contact <a href='https://bsky.app/profile/bluethread.bsky.social'>@BlueThread</a> if it happens again</p>";
        }
    }).catch((error) => {
        console.log(error)
    })
    
}

/* Initializes the modal window showing the thread is being sent */
function initializeModal(){
    document.getElementById("sending_state").innerHTML = "Sending the thread<span>.</span><span>.</span><span>.</span>";
    document.getElementById("output").innerHTML="";
    document.getElementById("btn_modal_back").style.display="none";
}

/* Closes the modal window
    i = 1 means cancel
    i = 0 means clear the text to start a new thread */
function closeModal(i){
    document.getElementById("modal_sending").close();
    if (i == 0){
        clearText();
    }
}

/* Checks the presence if images to warn the use it will erase them */
function checkImages(){
    if (nb_images_total && !warned > 0){
        alert ("Warning : editing the text will remove all the images.");
        warned = true;
    }
}