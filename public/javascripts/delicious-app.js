import '../sass/style.scss';

// Aliasing instead of having to write document.querySelector everywhere...
import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';

autocomplete($('#address'), $('#lat'), $('#lng'));

// Attach our search handlers to the search element
typeAhead($('.search'));

makeMap($('#map'));

// Select all forms, and handle their submission events with ajaxHeart
$$('form.heart').on('submit', ajaxHeart);
