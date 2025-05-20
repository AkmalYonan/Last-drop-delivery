function playClickSfx() {
  const clickSfx = document.getElementById("click-sfx");
  if (clickSfx) {
    clickSfx.currentTime = 0;
    clickSfx.play();
  }
}

document.querySelectorAll("img").forEach((btn) => {
  btn.addEventListener("click", playClickSfx);
});
