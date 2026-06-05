const KEY_HOTELS = "nw_admin_hotels";
const KEY_SPOTS = "nw_admin_spots";
const KEY_TRANSPORT = "nw_admin_transport";
const KEY_GUIDES = "nw_admin_guides";
const KEY_VENDORS = "nw_admin_vendors";

export function loadHotels(initial = []) {
  try {
    const raw = localStorage.getItem(KEY_HOTELS);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initial;
  } catch {
    return initial;
  }
}
export function saveHotels(hotels) {
  localStorage.setItem(KEY_HOTELS, JSON.stringify(hotels));
}

export function loadSpots(initial = []) {
  try {
    const raw = localStorage.getItem(KEY_SPOTS);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initial;
  } catch {
    return initial;
  }
}
export function saveSpots(spots) {
  localStorage.setItem(KEY_SPOTS, JSON.stringify(spots));
}

export function loadTransport(initial = []) {
  try {
    const raw = localStorage.getItem(KEY_TRANSPORT);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initial;
  } catch {
    return initial;
  }
}
export function saveTransport(routes) {
  localStorage.setItem(KEY_TRANSPORT, JSON.stringify(routes));
}

export function loadGuides(initial = []) {
  try {
    const raw = localStorage.getItem(KEY_GUIDES);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initial;
  } catch {
    return initial;
  }
}
export function saveGuides(guides) {
  localStorage.setItem(KEY_GUIDES, JSON.stringify(guides));
}

export function loadVendors(initial = []) {
  try {
    const raw = localStorage.getItem(KEY_VENDORS);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initial;
  } catch {
    return initial;
  }
}
export function saveVendors(vendors) {
  localStorage.setItem(KEY_VENDORS, JSON.stringify(vendors));
}
const KEY_VENDOR_PRODUCTS = "nw_admin_vendor_products";

export function loadVendorProducts(vendorId, initial = []) {
  try {
    const raw = localStorage.getItem(KEY_VENDOR_PRODUCTS);
    const parsed = raw ? JSON.parse(raw) : {};
    const list = parsed?.[vendorId];
    return Array.isArray(list) ? list : initial;
  } catch {
    return initial;
  }
}

export function saveVendorProducts(vendorId, products) {
  const raw = localStorage.getItem(KEY_VENDOR_PRODUCTS);
  const parsed = raw ? JSON.parse(raw) : {};
  parsed[vendorId] = products;
  localStorage.setItem(KEY_VENDOR_PRODUCTS, JSON.stringify(parsed));
}