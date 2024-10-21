var formData = new FormData();


/* Displays a dialog to ask the alt text and updates the input value */
var inputAlt = function (i, j){
    const img_src = document.getElementById("img"+i+"_"+j).src;

    document.getElementById("modal_image").showModal();

    const ta_alt = document.getElementById("ta_alt");
    ta_alt.value = document.getElementById("alt"+i+"_"+j).value; // get the previous alt value which is in the input field
    resizeTextarea(ta_alt);
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
    const new_alt_value = document.getElementById("ta_alt").value;
    const alt = document.getElementById("alt"+i+"_"+j);
    const btn_alt = document.getElementById("btn_alt"+i+"_"+j)
    const img = document.getElementById("img"+i+"_"+j)

    alt.value = new_alt_value;
    btn_alt.title = new_alt_value;
    img.title=new_alt_value;

    document.getElementById("modal_image").close();

    if (alt.value != ""){
        btn_alt.classList.add("green");
    }
    else{
        btn_alt.classList.remove("green");
    }

}


/* Called when a picture is added
   It adds the picture's thumbnail, and an input field for the alt text */
var loadFile = function(event, i) {

    const tr = document.getElementById('output_table_row'+i);
    const num_image = tr.cells.length+1;

    const fileInput = document.getElementById("input_images"+i);    // The input elements that contains the selected files

    const dataTransfer = new DataTransfer();    // to store temporarily the valid files that will be added to the input
    files = event.target.files ;

    // oldFiles gets the images already present in this post before the input change
    const oldFiles = formData.getAll("input_images"+i);

    // Initialization of the datatransfer with the aleady present files of this post
    for (let f of oldFiles){
        dataTransfer.items.add(f);
    }

    // "new_number" is used to number the html elements (and function calls)
    if (oldFiles.length > 0){
        var last_id = document.getElementById("output_table_row"+i).lastChild.firstChild.id;    // id of the last image for this post
        var new_number = parseInt(last_id.match("[1-9]+$")[0])+1;       // we take the last number of the id and add 1
    }
    else {
        var new_number = 1;     // if there is no image yet, new_number = 1
    }

    const maxSize = 1000000;    // Max size of a file (976 KB)

    /* Adds only the 4 first files to the input and to the thumbnail zone */
    for (var j = dataTransfer.items.length; j < files.length+oldFiles.length && j <= 3 ; ++j) {
        // console.log("j : ",j);

        var newFile = files[j-oldFiles.length];

        /* If the file is not too big, we add it */
        if (newFile.size <= maxSize ){

            dataTransfer.items.add(newFile);

            const image=document.createElement("img");
            image.src = URL.createObjectURL(newFile);
            image.id="img"+i+"_"+(new_number);

            const btn_alt=document.createElement("button");
            btn_alt.id = "btn_alt"+i+"_"+(new_number);
            btn_alt.innerText="ALT";
            btn_alt.classList.add("btn_alt");
            btn_alt.setAttribute("onclick", "inputAlt("+i+","+(new_number)+")");

            const remove_picture=document.createElement("span");
            remove_picture.innerText="×";
            remove_picture.classList.add("remove_picture");
            remove_picture.setAttribute("onclick", "removeImage("+i+","+(new_number)+")");

            const alt=document.createElement("textarea");
            alt.id="alt"+i+"_"+(new_number);
            alt.name="alt"+i;
            alt.style.display = "none";

            const td=document.createElement("td");
            td.appendChild(image);
            td.appendChild(btn_alt);
            td.appendChild(remove_picture);
            td.appendChild(alt);
            tr.appendChild(td);
        }
        else{
            console.log ("The picture " + newFile.name +" is larger than 976 KB. It will be compressed.");

            const blobURL = window.URL.createObjectURL(newFile);

            const img = new Image();
            img.src = blobURL;

            img.onload = function (ev) {
                // console.log("j (dans img.onload) :", j);
                window.URL.revokeObjectURL(blobURL); // release memory

                let scale = 1;
                let height = img.height;
                let width = img.width;

                if (height > 2000 || width > 2000){
                    scale = Math.min(1, Math.min(2000/width, 2000/height));
                    width = img.width * scale;
                    height = img.height * scale;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(function (blob) {
                    // Handle the compressed image

                    // console.log ("blob : ", blob);

                    const myFile = new File([blob], newFile.name, {
                        type: blob.type,
                    });

                    dataTransfer.items.add(myFile);
                    fileInput.files = dataTransfer.files;
                    formData.append("input_images"+i, myFile);

                }, "image/jpeg", 0.76);

            };

            const image=document.createElement("img");
            image.src = window.URL.createObjectURL(newFile);
            image.id="img"+i+"_"+(new_number);

            const btn_alt=document.createElement("button");
            btn_alt.id = "btn_alt"+i+"_"+(new_number);
            btn_alt.innerText="ALT";
            btn_alt.classList.add("btn_alt");
            btn_alt.setAttribute("onclick", "inputAlt("+i+","+(new_number)+")");

            const remove_picture=document.createElement("span");
            remove_picture.innerText="×";
            remove_picture.classList.add("remove_picture");
            remove_picture.setAttribute("onclick", "removeImage("+i+","+(new_number)+")");

            const alt=document.createElement("textarea");
            alt.id="alt"+i+"_"+(new_number);
            alt.name="alt"+i;
            alt.style.display = "none";

            const td=document.createElement("td");
            td.appendChild(image);
            td.appendChild(btn_alt);
            td.appendChild(remove_picture);
            td.appendChild(alt);
            tr.appendChild(td);
        }
        new_number++;
    }


    fileInput.files = dataTransfer.files;   // This affects the manipulated filelist to the input element

    /* Updating the formData with the new images */
    formData.delete("input_images"+i);

    for (let f of fileInput.files){
        formData.append("input_images"+i, f);
    }

    /* Disable the image button if there are 4 images in the post */
    if (tr.cells.length == 4){
        document.getElementById("input_images"+i).setAttribute("onClick", "event.preventDefault();");
        document.getElementById("label_input_images"+i).style.opacity = 0.4;
    }

};

/* Removes an image from the thumbnail zone and input list */
function removeImage(i, j){

    td = document.getElementById("img"+i+"_"+j).parentNode;  // selects the td element that contains the img
    cell_index = td.cellIndex;

    const fileInput = document.getElementById("input_images"+i);    // The input element that contains the selected files
    const dataTransfer = new DataTransfer();
    formData.delete("input_images"+i);

    for (var index = 0 ; index < fileInput.files.length ; ++index){
        if (index != cell_index){
            dataTransfer.items.add(fileInput.files[index]);     // Adding all the files except the one we want to remove
            formData.append("input_images"+i, fileInput.files[index]);
        }
    }

    /* Removes the td after the transition has ended */
    td.addEventListener("transitionend", () => {
        td.remove();
    });

    td.classList.add("shrink");    /* Add the 'removed' class which triggers the transition to shrink the td */

    //console.log(dataTransfer);
    fileInput.files = dataTransfer.files;

    /* Enable the button again to add images */
    document.getElementById("input_images"+i).removeAttribute ("onclick");
    document.getElementById("label_input_images"+i).style.opacity = 1;

}

/* Resizes a post textarea and updates the character number */
function resizePost(element){
    resizeTextarea(element);

    /* Updating the displayed number of characters */
    var nb_char = element.value.length;
    const span_nb_char = element.parentNode.getElementsByClassName("nb_char")[0].firstChild;
    span_nb_char.innerText = nb_char;

    if (nb_char > 300) {
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

    if (ta_posts.length > 0){

        /* Loop over every post textarea, and if one is empty, the send button is disabled. */
        try{
            ta_posts.forEach ( function (ta) {
                if (ta.value==""){
                    btn_send.disabled = true;
                    btn_send.title="Some of the posts are empty. The thread cannot be sent.";
                    btn_send.classList.add("disabled");
                    valid_thread = 0;
                    throw BreakException;
                }
                if(ta.value.length > 300){
                    btn_send.disabled = true;
                    btn_send.title="Some of the posts exceed 300 characters. The thread cannot be sent.";
                    btn_send.classList.add("disabled");
                    valid_thread = 0;
                    throw BreakException;
                }
            });
        } catch(e){ /* Breaking out of the loop */ }
    }
    else {
        document.getElementById("btn_remove_post").setAttribute("hidden", "true");
        document.getElementById("btn_add_post").setAttribute("hidden", "true");
        document.getElementById("select_lang").setAttribute("hidden", "true");
        document.getElementById("btn_send").setAttribute("hidden", "true");
        if(document.querySelector(".ts-wrapper") != null){
            document.querySelector(".ts-wrapper").setAttribute("hidden", "true");
        }
    }

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

/* Resizes a textarea to fit its content */
function resizeTextarea(ta){
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight-10 + "px";
}

/* Resizes all the posts textareas and calls the thread validation */
function resizePosts(){
    var ta = document.getElementById('div_posts').getElementsByClassName('ta_post');
    for (let element of ta) {
      resizePost(element);
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

    if (window.location.pathname == "/thread"){
        populateLanguages();
    }

}


/* Adds a new post at the bottom of the posts */
function addPost(i, post_text){

    const new_div = document.createElement("div");
    new_div.id="div_post"+(i+1);
    new_div.classList.add("div_post");

    const new_ta = document.createElement("textarea");
    new_ta.id = "ta_post"+(i+1);
    new_ta.name="post";
    new_ta.value=post_text;
    new_ta.classList.add("ta_post");
    new_ta.setAttribute("maxlength", 300);
    new_ta.setAttribute("oninput", "resizePost(this); checkThreadValidity();");

    const new_label = document.createElement("label");
    new_label.id="label_input_images"+(i+1);
    new_label.title="Add a picture to the post";
    new_label.setAttribute("for", "input_images"+(i+1));

    const new_input = document.createElement("input");
    new_input.id="input_images"+(i+1);
    new_input.type="file";
    new_input.name="input_images"+(i+1);
    new_input.setAttribute("accept", "image/png, image/jpg, image/jpeg, image/gif, video/mp4");
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


    resizePost(new_ta);
    checkThreadValidity();

    /* If there is only 2 posts (we just added one so there was only one before), we activate the remove button again */
    if (document.getElementsByClassName("div_post").length == 2){
        document.getElementById("btn_remove_post").hidden = false;
    }
}

/* Adds an empty post at the bottom of the posts  */
function addEmptyPost(){
    i = document.querySelectorAll(".ta_post").length;
    addPost(i, "");
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

    checkThreadValidity();
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
        length = 289; // Number of characters of a post (300 minus space for the number)
    }

    let start = 0; // Start index of the current post
    let end = length; // End index of the current post
    const thread = new Array(); // Array containing the posts to send
    let last_post = false;
    let post="";

    while (start < text.length ) {
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

//    document.getElementById("div_posts").innerHTML="";
    nb_divs = document.getElementById("div_posts").childNodes.length // Number of existing post divs on the right

    if (nb_divs == 0){  // If there was no post (the page has been reloaded) then we create them
        formData = new FormData();

        // Iteration on the thread elements to create the posts divs, buttons etc
        thread.forEach(function (post_text, i){
            addPost(i, post_text);
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
    }
    else{   // If there were already some posts
        ta_posts = document.querySelectorAll(".ta_post");

        for (i=0 ; i < thread.length || i < ta_posts.length ; i++){
            if (i < ta_posts.length && i < ta_posts.length ){
                ta_posts[i].value = thread[i];      // Simply updating the textarea value
            }
            if (i >= thread.length){     // The new thread is shorter, we remove the following posts (including images)
                if (formData.getAll("input_images"+(i+1)).length > 0) {
                        formData.delete("input_images"+(i+1));  //Removing the images from the formData
                }
                ta_posts[i].parentNode.remove();    // Removing the div containing this textarea

            }
            if(i >= ta_posts.length){   // The new thread is longer, we add new posts
                addPost(i, thread[i]);
            }

        }
        resizePosts();


    }
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

    let message_ok = "The thread has been successfully sent on ";
    let day = new Date().getDate();
    let month = new Date().getMonth();
    if (month == 11 && (day >= 15 && day <= 31)){
        message_ok = "🎅 Ho ho ho! The thread has been delivered on ";   // Special message around christmas 🎅
    }

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
            document.getElementById("sending_state").textContent = message_ok+res.name+"'s account! 😊";
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
