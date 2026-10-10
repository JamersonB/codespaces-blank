(() => {
  "use strict";

  const STORAGE_KEY = "northStarBakery.preorder.v1";
  const products = [
    {
      id: "sourdough",
      name: "Sourdough loaf",
      category: "Bread",
      price: "$5–$12 per loaf",
      description: "A slow-fermented everyday loaf for toast, sandwiches, and sharing.",
    },
    {
      id: "morning-pastries",
      name: "Morning pastries",
      category: "Pastries",
      price: "$3–$7 each",
      description: "Choose from buttery favorites and seasonal treats.",
    },
    {
      id: "celebration-cake",
      name: "Celebration cake inquiry",
      category: "Special orders",
      price: "Starts around $35",
      description: "Share the date and size in your request so the bakery can confirm options.",
    },
  ];

  const productById = Object.fromEntries(products.map((product) => [product.id, product]));

  function loadOrder() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .filter((item) => productById[item.id] && Number.isInteger(item.quantity))
        .map((item) => ({ id: item.id, quantity: Math.min(99, Math.max(1, item.quantity)) }));
    } catch {
      return [];
    }
  }

  function saveOrder(order) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
      return true;
    } catch {
      return false;
    }
  }

  function announce(message) {
    const status = document.getElementById("order-status");
    if (status) status.textContent = message;
  }

  function renderProducts(searchText = "") {
    const list = document.getElementById("product-list");
    if (!list) return;
    const query = searchText.trim().toLowerCase();
    const matches = products.filter((product) =>
      `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query),
    );
    list.replaceChildren();

    if (matches.length === 0) {
      const empty = document.createElement("li");
      empty.className = "product-empty";
      empty.textContent = "No items match that search. Try bread, pastry, or cake.";
      list.append(empty);
      return;
    }

    matches.forEach((product) => {
      const card = document.createElement("li");
      card.className = "product-card";

      const category = document.createElement("p");
      category.className = "product-category";
      category.textContent = product.category;
      const heading = document.createElement("h3");
      heading.textContent = product.name;
      const description = document.createElement("p");
      description.textContent = product.description;
      const price = document.createElement("p");
      price.className = "product-price";
      price.textContent = `Typical price: ${product.price}`;

      const controls = document.createElement("div");
      controls.className = "product-controls";
      const quantityLabel = document.createElement("label");
      quantityLabel.textContent = "Quantity";
      const quantity = document.createElement("input");
      quantity.type = "number";
      quantity.min = "1";
      quantity.max = "99";
      quantity.step = "1";
      quantity.value = "1";
      quantity.setAttribute("aria-label", `Quantity for ${product.name}`);
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.textContent = "Add to pickup list";
      addButton.addEventListener("click", () => {
        const count = Number.parseInt(quantity.value, 10);
        if (!Number.isInteger(count) || count < 1 || count > 99) {
          announce("Choose a quantity from 1 to 99.");
          quantity.focus();
          return;
        }
        addToOrder(product.id, count);
      });
      quantityLabel.append(quantity);
      controls.append(quantityLabel, addButton);
      card.append(category, heading, description, price, controls);
      list.append(card);
    });
  }

  function renderOrder(order = loadOrder()) {
    const list = document.getElementById("saved-order-list");
    const empty = document.getElementById("empty-order-message");
    const count = document.getElementById("order-count");
    const clearButton = document.getElementById("clear-order");
    if (!list || !count || !empty || !clearButton) return;
    list.replaceChildren();
    const totalUnits = order.reduce((total, item) => total + item.quantity, 0);
    count.textContent = `${totalUnits} ${totalUnits === 1 ? "item" : "items"}`;
    empty.hidden = order.length > 0;
    clearButton.hidden = order.length === 0;

    order.forEach((item) => {
      const product = productById[item.id];
      if (!product) return;
      const row = document.createElement("li");
      const detail = document.createElement("span");
      detail.textContent = `${item.quantity} × ${product.name}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-order-item";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${product.name} from pickup list`);
      remove.addEventListener("click", () => removeFromOrder(item.id));
      row.append(detail, remove);
      list.append(row);
    });
  }

  function addToOrder(productId, quantity) {
    const order = loadOrder();
    const existing = order.find((item) => item.id === productId);
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
    else order.push({ id: productId, quantity });
    if (saveOrder(order)) {
      renderOrder(order);
      announce(`${quantity} ${productById[productId].name} added to your saved pickup list.`);
    } else {
      announce("Your browser could not save this list. Check its storage settings and try again.");
    }
  }

  function removeFromOrder(productId) {
    const order = loadOrder().filter((item) => item.id !== productId);
    if (saveOrder(order)) {
      renderOrder(order);
      announce("Item removed from your saved pickup list.");
    }
  }

  function startProductFeature() {
    const search = document.getElementById("product-search");
    const clearButton = document.getElementById("clear-order");
    search?.addEventListener("input", () => renderProducts(search.value));
    clearButton?.addEventListener("click", () => {
      if (saveOrder([])) {
        renderOrder([]);
        announce("Your saved pickup list has been cleared.");
      }
    });
    renderProducts();
    renderOrder();
  }

  function setFieldError(field, message) {
    const error = document.getElementById(`${field.id}-error`);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
    return !message;
  }

  function validateField(field) {
    const value = field.value.trim();
    let message = "";
    if (field.name === "name" && value.length < 2) message = "Enter your name (at least 2 characters).";
    if (field.name === "email") {
      if (!value) message = "Enter your email address.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Enter an email address in the format name@example.com.";
    }
    if (field.name === "request-type" && !value) message = "Choose a request type.";
    if (field.name === "pickup-date") {
      if (!value) message = "Choose a preferred pickup date.";
      else if (value < getLocalDateString()) message = "Choose today or a future date.";
    }
    if (field.name === "items" && value.length < 5) message = "Describe the items and quantities (at least 5 characters).";
    if (field.name === "allergies" && value.length > 300) message = "Keep allergy notes under 300 characters.";
    return setFieldError(field, message);
  }

  function getLocalDateString() {
    const now = new Date();
    const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 10);
  }

  function loadOrderIntoForm() {
    const itemsField = document.getElementById("items");
    const status = document.getElementById("saved-order-notice");
    if (!itemsField || !status) return;
    const order = loadOrder();
    if (order.length === 0 || itemsField.value.trim()) return;
    itemsField.value = order.map((item) => `${item.quantity} × ${productById[item.id].name}`).join("\n");
    status.textContent = "Your saved pickup list was added here. You can edit it before sending your inquiry.";
  }

  function startFormValidation() {
    const form = document.getElementById("preorder-form");
    if (!form) return;
    const fields = [...form.querySelectorAll("input, select, textarea")];
    const status = document.getElementById("form-status");
    fields.forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
      field.addEventListener("change", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const valid = fields.map(validateField).every(Boolean);
      if (!valid) {
        if (status) status.textContent = "Please correct the highlighted fields. Your entries are still here.";
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      if (status) status.textContent = "Your sample request passed the form checks. This demo does not transmit or place orders; contact the bakery to confirm availability and pickup.";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.page === "products") startProductFeature();
    if (document.body.dataset.page === "contact") {
      loadOrderIntoForm();
      startFormValidation();
    }
  });
})();
