// import num from './test';
// const x = 45;
// console.log(`Imported ${num} from another Module called test.js Variable x is ${x}`);

//ES6 Modules
// 3 Ways to Import
// 1>
// import str from './models/Search';

// 2>
// name between {} should be exact same as that of in export
// import { add, multiply, ID } from './views/searchView';
// console.log(`Using imported functions ${add(ID, 2)} and ${multiply(3, 5)}. ${str}.`);
// to give our own name
// import { add as a, multiply as m, ID } from './views/searchView';
// console.log(`Using imported functions ${a(ID, 2)} and ${m(3, 5)}. ${str}.`);

// 3>
// creates an Object of imported data and create instance as the name provided
// import * as searchView from './views/searchView';
// console.log(`Using imported functions ${searchView.add(searchView.ID, 2)} and ${searchView.multiply(3, 5)}. ${str}.`);

////////////////////////////
// Global app controller
////////////////////////////

import Search from './models/Search';
import { Recipe } from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import { elements, renderLoader, clearLoader } from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

/**Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
	// 1} Get query from view
	const query = searchView.getInput();

	if (query) {
		// 2) New search object and add to state
		state.search = new Search(query);

		// 3) Prepare UI for results
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);

		try {
			// 4) Search for recipe
			await state.search.getRecipes();
			//console.log(state.search.results);

			// 5) Render results on UI
			clearLoader();
			searchView.renderResults(state.search.results);
		}
		catch (err) {
			clearLoader();
			alert('Something went wrong :(');
		}
	}
};

elements.searchForm.addEventListener('submit', e => {
	e.preventDefault();
	controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
	let btn = e.target.closest('.btn-inline');
	if (btn) {
		const goToPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.renderResults(state.search.results, goToPage);
	}
});


/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
	//Get ID from url
	const id = window.location.hash.replace('#', '');
	//console.log(id);

	if (id) {
		// 1) Prepare UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		// 2) Highlighted selected search id
		if (state.search) searchView.highlightSelected(id);

		// 3) Create new Recipe Object
		state.recipe = new Recipe(id);

		try {
			// 4) Get recipe data
			await state.recipe.getRecipe()
			//console.log(state.recipe.ingredients);
			state.recipe.parseIngredients();

			// 5) Calculate servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();

			// 6) Render recipe
			clearLoader();
			recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));


		}
		catch (err) {
			// alert('Error processing Recipe!!');
			alert(err);
		}

	}
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/**
 * LIST CONTROLLER
 */
const controlList = () => {
	// Create a new list if there is not yet
	if (!state.list) state.list = new List();

	// Add each ingredient to the list and UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});

};

// Handle delete and Update List items
elements.shopping.addEventListener('click', e => {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	// Handle Delete from UI and Data
	elements.shopping.addEventListener('click', e => {
		if (e.target.matches('.shopping__delete, .shopping__delete *')) {
			// Delete from state
			state.list.deleteItem(id);

			// Delete from UI
			listView.deleteItem(id);
		}
		else if (e.target.matches('.shopping__count-value')) {
			const val = parseFloat(e.target.value, 10);
			console.log(e.target.value);
			state.list.updateCount(id, val);
		}
	});

});

window.addEventListener('load', () => {
	state.likes = new Likes();

	// Restore likes
	state.likes.readStorage();

	// Toggle like menu button
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	// Render the existing likes
	state.likes.likes.forEach(like => likesView.renderLike(like));

})

/**
 * LIKES CONTROLLER
 */
const controlLike = () => {
	const currentID = state.recipe.id;

	if (!state.likes) state.likes = new Likes();

	// IF current recipe is NOT liked
	if (!state.likes.isLiked(currentID)) {
		// Add like to the state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
		);

		// Toggle Like button
		likesView.toggleLikeBtn(true);

		// Add like to UI list
		likesView.renderLike(newLike);

	}// Current recipe IS liked
	else {
		// Remove like from the state
		state.likes.deleteLike(currentID);

		// Toggle Like button
		likesView.toggleLikeBtn(false);

		// Remove like from UI list
		likesView.deleteLike(currentID);

	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
};


elements.recipe.addEventListener('click', e => {
	if (e.target.matches('.btn-dec, .btn-dec *')) {
		// Decrease is clicked
		if (state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServings(state.recipe);
		}
	}
	else if (e.target.matches('.btn-inc, .btn-inc *')) {
		// Increase is clicked
		state.recipe.updateServings('inc');
		recipeView.updateServings(state.recipe);
	}
	else if (e.target.matches('.recipe__btn, .recipe__btn *')) {
		// Add ingredients to shopping list
		controlList();
	}
	else if (e.target.matches('.recipe__love, .recipe__love *')) {
		// Add recipe to Like
		controlLike();
	}
});