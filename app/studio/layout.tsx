export { metadata, viewport } from "next-sanity/studio";

// Polyfills pour navigateurs anciens (Safari < 16, Chrome < 110, Firefox < 115).
// Sanity Studio v5 utilise des methodes Array de 2023 (toSorted, etc.) qui
// plantent sur ces navigateurs. Ce script est rendu cote serveur dans le HTML
// de /studio et s'execute AVANT le bundle du Studio. Scope a /studio uniquement :
// le site public n'est pas concerne.
const legacyPolyfills = `
(function(){
  var A = Array.prototype;
  if (!A.toSorted) A.toSorted = function(cmp){ return Array.prototype.slice.call(this).sort(cmp); };
  if (!A.toReversed) A.toReversed = function(){ return Array.prototype.slice.call(this).reverse(); };
  if (!A.with) A.with = function(i, v){ var a = Array.prototype.slice.call(this); a[i < 0 ? a.length + i : i] = v; return a; };
  if (!A.toSpliced) A.toSpliced = function(){ var a = Array.prototype.slice.call(this); Array.prototype.splice.apply(a, arguments); return a; };
  if (!A.findLast) A.findLast = function(fn, t){ for (var i = this.length - 1; i >= 0; i--) if (fn.call(t, this[i], i, this)) return this[i]; return undefined; };
  if (!A.findLastIndex) A.findLastIndex = function(fn, t){ for (var i = this.length - 1; i >= 0; i--) if (fn.call(t, this[i], i, this)) return i; return -1; };
  if (!Object.hasOwn) Object.hasOwn = function(o, k){ return Object.prototype.hasOwnProperty.call(o, k); };
})();
`;

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: legacyPolyfills }} />
      {children}
    </>
  );
}
