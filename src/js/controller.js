import * as model from './model.js';
import { MODAL_CLOSE_SEC } from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
const contorlRecipes = async function () {
  try {
    const id = window.location.hash.slice(1);

    if (!id) return;
    recipeView.renderSpinner();

    // 0) Update results view to mark selected search result
    // ode u view, odradi funk koja je u zagradi, i onda zameni samo html zbog selektovanog recepta
    resultsView.update(model.getSearchResultsPage());

    // 1) Updating bookmarks view
    bookmarksView.update(model.state.bookmarks);

    // 2) Loading recepie
    await model.loadRecipe(id);

    // 3) Rendering recipe
    recipeView.render(model.state.recipe);
  } catch (err) {
    recipeView.renderError();
    console.error(err);
  }
};

const controlSearchResults = async function () {
  try {
    resultsView.renderSpinner();
    // 1) Get search query
    const query = searchView.getQuery();
    if (!query) return;

    // 2) Load search results
    await model.loadSearchResults(query);

    // 3) Render results
    //resultsView.render(model.state.search.results); FOR ALL RESULTS
    resultsView.render(model.getSearchResultsPage());

    // 4) Render inital pagination buttons
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

const controlPagination = function (goToPage) {
  // 3) Render NEW results
  //resultsView.render(model.state.search.results); FOR ALL RESULTS
  resultsView.render(model.getSearchResultsPage(goToPage));

  // 4) Render NEW pagination buttons
  paginationView.render(model.state.search);
};

const controlServings = function (newServings) {
  // Update recipe survings (in state)
  model.updateServings(newServings);

  // Update the recipe view
  //recipeView.render(model.state.recipe);
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
  // 1) Add/remove bookmark
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);

  // 2) Update recipe view
  recipeView.update(model.state.recipe);

  // 3) Render bookmarks
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    // Show loading spinner
    addRecipeView.renderSpinner();

    // Upload the new recipe data
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // Render recipe
    recipeView.render(model.state.recipe);

    // Success message
    addRecipeView.renderMessage();

    // Render bookmark view
    bookmarksView.render(model.state.bookmarks);

    // Change ID in URL
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // Close form window
    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000);
  } catch (err) {
    console.error('.', err);
    addRecipeView.renderError(err.message);
  }
};

const controlDeleteRecipe = async function () {
  console.log('controlDeleteRecipe function called');
  try {
    const id = window.location.hash.slice(1);
    console.log('Recipe ID:', id);
    if (!id) return;

    const url = `https://forkify-api.herokuapp.com/api/v2/recipes/${id}?key=8de23056-7e03-4378-8e07-fbf2099822b3`;
    console.log('DELETE request URL:', url);

    const response = await fetch(url, {
      method: 'DELETE',
    });

    const data = await response.json();
    console.log('API Response:', data);

    localStorage.removeItem('bookmarks');
    console.log(localStorage.getItem('bookmarks'));
    bookmarksView.update(model.state.bookmarks);
    console.log(localStorage.getItem('bookmarks'));
    if (!response.ok) throw new Error(`Recipie DELETED`);
    // throw new Error(`Failed to delete the recipe: ${data.message}`);

    // Provide feedback or redirect the user
    window.location.hash = '';
    recipeView.renderMessage('Recipe successfully deleted!');
  } catch (err) {
    console.error('Error:', err);
    // recipeView.renderError(`Failed to delete the recipe. ${err.message}`);
    recipeView.renderError(`RECIPIE DELETED`);
  }
};

const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks);

  recipeView.addHandlerRender(contorlRecipes);

  recipeView.addHandlerUpdateServings(controlServings);

  recipeView.addHandlerAddBookmark(controlAddBookmark);

  searchView.addHandlerSearch(controlSearchResults);

  paginationView.addHandlerClick(controlPagination);

  addRecipeView.addHandlerUpload(controlAddRecipe);
  recipeView.addHandlerDeleteRecipe(controlDeleteRecipe);
};
init();
