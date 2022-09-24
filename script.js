var contentArray = localStorage.getItem('items') ? JSON.parse(localStorage.getItem('items')) : [];

document.getElementById("save_card").addEventListener("click", () => {
  addFlashcard();
});

document.getElementById("delete_cards").addEventListener("click", () => {
  localStorage.clear();
  flashcards.innerHTML = '';
  contentArray = [];
});

document.getElementById("show_card_box").addEventListener("click", () => {
  document.getElementById("create_card").style.display = "block";
});

document.getElementById("close_card_box").addEventListener("click", () => {
  document.getElementById("create_card").style.display = "none";
});


flashcardMaker = (text, delThisIndex) => {
  const divFlipCard = document.createElement("div");
  /*const question = document.createElement('h2');
  const answer = document.createElement('h2');
  const del = document.createElement('i');*/
  //const mnemonic = document.createElement('img');

  divFlipCard.className = 'flip-card mySlides fade';

  /*question.setAttribute("style", "border-top:1px solid red; padding: 15px; margin-top:30px");
  question.textContent = text.my_question;

  answer.setAttribute("style", "text-align:center; display:none; color:red");
  answer.textContent = text.my_answer;*/

  //divFlipCard.classList.add("flip-card");
  const divFlipCardInner = document.createElement("div");
  divFlipCardInner.classList.add("flip-card-inner");

  const divFlipCardFront = document.createElement("div");
  divFlipCardFront.classList.add("flip-card-front");

  const h1= document.createElement('H1');
  h1.innerHTML = text.my_question;
  divFlipCardFront.appendChild(h1);

  const uploaded = document.getElementById("display-image").cloneNode(true);
  uploaded.classList.add("flipcard_image");

  const clonedUploadedFront = uploaded.cloneNode(true);
  divFlipCardFront.appendChild(clonedUploadedFront)

  /* back */
  const divFlipCardBack= document.createElement("div");
  divFlipCardBack.classList.add("flip-card-back");

  const p= document.createElement('p');
  p.innerHTML = text.my_answer;

  const cloneh1 = h1.cloneNode(true);
  divFlipCardBack.appendChild(cloneh1);
  divFlipCardBack.appendChild(p);

  const clonedUploadedBack = clonedUploadedFront.cloneNode(true);
  divFlipCardBack.appendChild(clonedUploadedBack)

  /*adding memorize buttom*/
  const btn = document.createElement("button");
  btn.innerHTML = "Memorize this";
  divFlipCardBack.appendChild(btn);

  /*appending children*/
  divFlipCardInner.appendChild(divFlipCardFront);
  divFlipCardInner.appendChild(divFlipCardBack);
  divFlipCard.appendChild(divFlipCardInner);

  divFlipCard.style.display = "none";
  document.getElementById("flipcards").appendChild(divFlipCard);
 
	/*
  del.className = "fas fa-minus";
  del.addEventListener("click", () => {
    contentArray.splice(delThisIndex, 1);
    localStorage.setItem('items', JSON.stringify(contentArray));
    window.location.reload();
  })*/
}

contentArray.forEach(flashcardMaker);

addFlashcard = () => {
  const question = document.querySelector("#question");
  const answer = document.querySelector("#answer");

  let flashcard_info = {
    'my_question' : question.value,
    'my_answer'  : answer.value
  }

  contentArray.push(flashcard_info);
  localStorage.setItem('items', JSON.stringify(contentArray));
  flashcardMaker(contentArray[contentArray.length - 1], contentArray.length - 1);
  question.value = "";
  answer.value = "";
}


const image_input = document.querySelector("#image-input");

image_input.addEventListener("change", function() {
  const reader = new FileReader();
  console.log("before")
  reader.addEventListener("load", () => {
    const uploaded_image = reader.result;
    document.querySelector("#display-image").style.backgroundImage = `url(${uploaded_image})`;
  });
  console.log("after 1")
  reader.readAsDataURL(this.files[0]);
  console.log("after 2")
});


let slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}


function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
}
