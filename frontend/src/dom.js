/** Minimal element helpers, so views read as structure rather than string soup. */

const SVG_NS = "http://www.w3.org/2000/svg";

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  applyProps(node, props);
  append(node, children);
  return node;
}

export function svg(tag, props = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === false || value == null) continue;
    node.setAttribute(key, value === true ? "" : String(value));
  }
  append(node, children);
  return node;
}

function applyProps(node, props) {
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;

    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "style") Object.assign(node.style, value);
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key in node && key !== "list") node[key] = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
}

function append(node, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

/** The bound mark: a ring held closed by a bar. */
export function mark(className = "mark") {
  return svg("svg", { class: className, viewBox: "0 0 24 24", "aria-hidden": "true" }, [
    svg("circle", {
      cx: 12,
      cy: 12,
      r: 8.5,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 1.5,
    }),
    svg("line", {
      x1: 1.5,
      y1: 12,
      x2: 22.5,
      y2: 12,
      stroke: "currentColor",
      "stroke-width": 1.5,
      "stroke-linecap": "round",
    }),
  ]);
}

export function icon(paths, opts = {}) {
  return svg(
    "svg",
    { viewBox: "0 0 16 16", "aria-hidden": "true", ...opts },
    paths.map((d) => svg("path", { d }))
  );
}

export const ICON_CLOSE = ["M4 4l8 8", "M12 4l-8 8"];
export const ICON_TRASH = ["M3 4.5h10", "M6.5 4.5V3h3v1.5", "M4.5 4.5l.6 8h5.8l.6-8"];
export const ICON_CHECK = ["M3.5 8.5l3 3 6-7"];
