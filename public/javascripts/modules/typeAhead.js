const axios = require('axios');

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
    // Clear out content until we get a match (ie. user deletes a letter, etc)
    searchResults.innerHTML = '';

    axios.get(`/api/search?q=${this.value}`)
      .then((res) => {
        if (res.data.length) {
          // If we have any results, render them inside the search results div
          searchResults.innerHTML = searchResultsHTML(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });
}

export default typeAhead;
