import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  // this is the form element tag... which has the action url for us!
  axios.post(this.action)
  .then((res) => {
    // In forms, child elements with a name attribute can be access with this.name
    const isHearted = this.heart.classList.toggle('heart__button--hearted');
    $('.heart-count').textContent = res.data.hearts.length;
    if (isHearted) {
      this.heart.classList.add('heart__button--float');
      setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500);
    }
  })
  .catch((err) => {
    console.error(err);
  });
}

export default ajaxHeart;
