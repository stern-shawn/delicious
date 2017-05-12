import '../sass/style.scss';

// Aliasing instead of having to write document.querySelector everywhere...
import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';

autocomplete($('#address'), $('#lat'), $('#lng'));
