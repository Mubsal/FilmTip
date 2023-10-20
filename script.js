document.addEventListener("DOMContentLoaded", () => {
    //Här kanske jag måste kryptera min API nyckel?
    const API_KEY = '2f1c890';
    const API_URL = 'https://www.omdbapi.com/';

    const form = document.getElementById("searchForm");
    const search = document.getElementById("search");
    const main = document.getElementById("topMoviesList");
    

    let currentPage = 1;
    const moviesPerPage = 4;
    let fetchedMovies = [];

    async function fetchDataFromAPI(imdbID) {
        const url = `${API_URL}?i=${imdbID}&apikey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Kunde inte hämta data ${response.status}`);
        }
        return await response.json();
    }

    async function fetchDataFromAPI2(searchTerm = 'Planet of apes') { //Hämtar apornas planet tills dess jag fattat hur man hämtar top filmer
        const SEARCH_URL = `${API_URL}?s=${searchTerm}&apikey=${API_KEY}`;
    
        try {
            let response = await fetch(SEARCH_URL);
            let data = await response.json();
            if (data && data.Search) {
                const movieDetailsPromises = data.Search.map(movie => fetchDataFromAPI(movie.imdbID));
                fetchedMovies = await Promise.all(movieDetailsPromises);
                fetchedMovies.sort((a, b) => b.imdbRating - a.imdbRating);
                showMovies(fetchedMovies.slice(0, moviesPerPage));
                generatePagination(fetchedMovies.length);
            } else {
                console.error('Fel! Gick inte att hämta data:', data.Error);
            }
        } catch (error) {
            console.error('Fel! Gick inte att hämta data:', error.message);
        }
    }

    function showMovies(movies) {
        main.innerHTML = "";
        movies.forEach(movie => {
            let { Title, Poster, imdbID, Plot = '', imdbRating } = movie; 
            const shortPlot = Plot.split('. ')[0] + '.';
    
            let movieElement = document.createElement("li");
            movieElement.classList.add("movie");
            movieElement.innerHTML = `
                <img src="${Poster}" alt="${Title}">
                <div class="movie-info">
                    <h2>${Title}</h2>
                    <span class="rating">Betyg: ${imdbRating}</span>
                    <p class="plot-short">${shortPlot} <span class="readMore">Läs mer...</span></p>
                    <p class="plot-full" style="display: none">${Plot} <span class="readLess"><bold>Läs mindre...</bold></span></p>
                    <div class="vote-section">
                       <button class="vote-btn">Rösta</button>
                    </div>
                </div>`;
    //<span class="imdbID">imdb ID: ${imdbID}</span> här är id
            movieElement.querySelector('.readMore').addEventListener('click', function() {
                this.parentElement.style.display = 'none';
                movieElement.querySelector('.plot-full').style.display = 'block';
            });
            
            movieElement.querySelector('.readLess').addEventListener('click', function() {
                this.parentElement.style.display = 'none';
                movieElement.querySelector('.plot-short').style.display = 'block';
            });
            movieElement.querySelector('.vote-btn').addEventListener('click', function() {
                let voteSpan = movieElement.querySelector('.votes-count');
                let votes = parseInt(voteSpan.textContent) || 0; 
                votes += 1;
                voteSpan.textContent = ` Röster ${votes}`;
                localStorage.setItem(imdbID, votes);
            });
    
            main.appendChild(movieElement);
            movieElement.querySelector('.movie-info').addEventListener('click', function() {
                localStorage.setItem('selectedMovie', JSON.stringify(movie));
                window.location.href = 'details.html';
            });
        });
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        let searchTerm = search.value.trim();
        if (searchTerm && searchTerm !== "") {
            fetchDataFromAPI2(searchTerm);
            search.value = "";
        } else {
            fetchDataFromAPI2();
        }
    });

    function handlePaginationClick(event) {
        event.preventDefault();
        if (event.target.classList.contains('pagination__item')) {
            const pageNumber = parseInt(event.target.textContent);
            currentPage = pageNumber;
            const startIndex = (pageNumber - 1) * moviesPerPage;
            const endIndex = startIndex + moviesPerPage;
            showMovies(fetchedMovies.slice(startIndex, endIndex));
        }
    }

    function generatePagination(totalMovies) {
        const paginationContainerElement = document.querySelector('.pagination');
        paginationContainerElement.innerHTML = '';
        const numberOfPages = Math.ceil(totalMovies / moviesPerPage);
        for (let i = 1; i <= numberOfPages; i++) {
            let pageElement = document.createElement("a");
            pageElement.href = `?page=${i}`;
            pageElement.innerText = i;
            pageElement.classList.add('pagination__item');
            paginationContainerElement.appendChild(pageElement);
        }
    }

    const paginationContainerElement = document.querySelector('.pagination');
    paginationContainerElement.addEventListener('click', handlePaginationClick);

    fetchDataFromAPI2();
});

if (document.querySelector('.movie-details')) {
    const movie = JSON.parse(localStorage.getItem('selectedMovie'));
    if (movie) {
        document.getElementById('movie-poster').src = movie.Poster;
        document.getElementById('movie-title').innerText = movie.Title;
        document.getElementById('movie-plot').innerText = movie.Plot;
        document.getElementById('movie-Rate').innerText = movie.imdbRating;
        const movieVotes = localStorage.getItem(movie.imdbID) || 0;  // lägg som 0 om det inte finns något i localstorage
        const voteDisplay = document.createElement('p');
        //voteDisplay.innerText = `Röster: ${movieVotes} `;
        document.querySelector('.movie-details').appendChild(voteDisplay);
    }
}
const voteButtons = document.querySelectorAll('.vote-btn');
const medianDisplay = document.getElementById('median-display');
const votes = [];

voteButtons.forEach(button => {
    button.addEventListener('click', function() {
        // plusa på och visa antal klick
        const countSpan = button.querySelector('.count');
        const currentCount = parseInt(countSpan.textContent);
        countSpan.textContent = currentCount +1;

        // Ta värde och lägg in i array
        const voteValue = parseInt(button.getAttribute('data-vote'));
        votes.push(voteValue);

        // Sotera arrayen
        votes.sort((a, b) => a - b);

        // kalkylera median?
        const mid = Math.floor(votes.length / 2);
        let median;
        if (votes.length % 2 === 0) {
            median = (votes[mid - 1] + votes[mid]) / 2;
        } else {
            median = votes[mid];
        }

        // Uppdatera median display
        medianDisplay.innerText = median;

        // Byt färg baserat på vilet värde det är
        if (median <= 2) {
            medianDisplay.style.color = 'red';
        } else if (median >= 2.5 && median < 3.5) {
            medianDisplay.style.color = 'orange';
        } else {
            medianDisplay.style.color = 'green';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    var hamburger = document.getElementById('hamburger');
    var mobileNav = document.getElementById('mobileNav');
    var closeIcon = document.getElementById('closeIcon'); 
    var bars = document.querySelectorAll('.bar');

    hamburger.addEventListener('click', function() {
        if (mobileNav.style.display === 'flex') {
            mobileNav.style.display = 'none';
            closeIcon.style.display = 'none';
            bars.forEach(function(bar) {
                bar.style.display = 'block'; // Visa hamburgermenyn när menyn är stängd
            });
        } else {
            mobileNav.style.display = 'flex';
            closeIcon.style.display = 'block'; // visa stäng ikonen när menyn är öppen
            bars.forEach(function(bar) {
                bar.style.display = 'none'; // göm alla bars när menyn är öppen
            });
        }
    });
});
