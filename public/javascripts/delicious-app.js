import '../sass/style.scss';

// Aliasing instead of having to write document.querySelector everywhere...
import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';

autocomplete($('#address'), $('#lat'), $('#lng'));

// Attach our search handlers to the search element
typeAhead($('.search'));
