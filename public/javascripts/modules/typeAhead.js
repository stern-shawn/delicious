const axios = require('axios');
const dompurify = require('dompurify');

// Given an array of store results, generate the HTML for each link
function searchResultsHTML(stores) {
  return stores.map(store => `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>`,
  ).join('');
}

// Given our search element, ping our search api for results based on user input and render options!
function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function () {
    // If no value, hide and stop
    if (!this.value) {
      searchResults.style.display = 'none';
      return;
    }

    // Show results
    searchResults.style.display = 'block';

    axios.get(`/api/search?q=${this.value}`)
      .then((res) => {
        if (res.data.length) {
          // If we have any results, render them inside the search results div
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
          return;
        }

        // Otherwise, indicate that there are no results for this query
        searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${this.value} found!</div>`);
      })
      .catch((err) => {
        console.error(err);
      });
  });

  // Handle keyboard interaction
  searchInput.on('keyup', (e) => {
    // If keyCode isn't enter, up, or down, do nothing
    if (![13, 38, 40].includes(e.keyCode)) return;

    const activeClass = 'search__result--active';
    // Get the currently active node
    const current = search.querySelector(`.${activeClass}`);
    // Get ALL possible nodes to we can decide which is next relative to current
    const items = search.querySelectorAll('.search__result');
    // Only apply the selection logic if there are results in the first place...
    // Otherwise you'll get errors for trying to modify classList of undefined, etc.
    if (items.length) {
      let next;
      if (e.keyCode === 40 && current) {
        // If downarrow and there is no next element, fallback to the first element
        next = current.nextElementSibling || items[0];
      } else if (e.keyCode === 40) {
        // If it's the first time hitting down, select the first element
        next = items[0];
      } else if (e.keyCode === 38 && current) {
        // Conversely for uparrow while something is selected, go to prev or last as a fallback
        next = current.previousElementSibling || items[items.length - 1];
      } else if (e.keyCode === 38) {
        // If it's the first time hitting up, select the last element
        next = items[items.length - 1];
      } else if (e.keyCode === 13 && current.href) {
        // If it's enter... navigate there
        window.location = current.href;
        // If we do navigate elsewhere, don't try to edit the menu styling as below (it'll be gone)
        return;
      }

      // Now that we have next selected, clear active class then add to this element
      if (current) {
        current.classList.remove(activeClass);
      }
      next.classList.add(activeClass);
    }
  });
}

export default typeAhead;
