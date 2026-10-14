(() => {
  'use strict';

  /* ==========================================================================
     1. Bootstrap Form Validation
     ========================================================================== */
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });

  /* ==========================================================================
     2. Tax Switch Toggle (Display Total After Taxes)
     ========================================================================== */
  const taxSwitch = document.getElementById('taxSwitch');
  if (taxSwitch) {
    const taxBadges = document.querySelectorAll('.tax-badge');

    // Restore saved tax preference
    const savedTaxPref = localStorage.getItem('roamhaven_show_taxes');
    if (savedTaxPref === 'true') {
      taxSwitch.checked = true;
      taxBadges.forEach(badge => badge.classList.remove('d-none'));
    }

    taxSwitch.addEventListener('change', () => {
      const showTax = taxSwitch.checked;
      localStorage.setItem('roamhaven_show_taxes', showTax);
      taxBadges.forEach(badge => {
        if (showTax) {
          badge.classList.remove('d-none');
          badge.classList.add('animate-fade-in');
        } else {
          badge.classList.add('d-none');
          badge.classList.remove('animate-fade-in');
        }
      });
    });
  }

  /* ==========================================================================
     3. Category & Live Search Filtering
     ========================================================================== */
  const filterPills = document.querySelectorAll('.filter');
  const listingItems = document.querySelectorAll('.listing-col-item');
  const filterStatusBox = document.getElementById('filterStatusBox');
  const filterStatusText = document.getElementById('filterStatusText');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  const resetAllFiltersBtn = document.getElementById('resetAllFiltersBtn');
  const noResultsState = document.getElementById('noResultsState');
  const searchInput = document.getElementById('navSearchInput');

  let activeCategory = 'All';
  let activeSearchTerm = '';

  function applyFilters() {
    let visibleCount = 0;

    listingItems.forEach(item => {
      const itemCategory = item.getAttribute('data-category') || '';
      const itemTitle = item.getAttribute('data-title') || '';
      const itemLocation = item.getAttribute('data-location') || '';

      const matchesCategory = (activeCategory === 'All') || (itemCategory.toLowerCase() === activeCategory.toLowerCase());
      const matchesSearch = !activeSearchTerm || itemTitle.includes(activeSearchTerm) || itemLocation.includes(activeSearchTerm);

      if (matchesCategory && matchesSearch) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    // Update Status Bar
    if (filterStatusBox && filterStatusText) {
      if (activeCategory !== 'All' || activeSearchTerm) {
        filterStatusBox.classList.remove('d-none');
        let statusMsg = `Showing ${visibleCount} Haven${visibleCount === 1 ? '' : 's'}`;
        if (activeCategory !== 'All') statusMsg += ` in "${activeCategory}"`;
        if (activeSearchTerm) statusMsg += ` matching "${activeSearchTerm}"`;
        filterStatusText.textContent = statusMsg;
      } else {
        filterStatusBox.classList.add('d-none');
      }
    }

    // Toggle Empty State
    if (noResultsState) {
      if (visibleCount === 0 && listingItems.length > 0) {
        noResultsState.classList.remove('d-none');
      } else {
        noResultsState.classList.add('d-none');
      }
    }
  }

  // Category Pill Click Handlers
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-category') || 'All';
      applyFilters();
    });
  });

  // Search Input Handler (Live Instant Filter)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchTerm = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // Clear / Reset Filter Handlers
  function resetAllFilters() {
    activeCategory = 'All';
    activeSearchTerm = '';
    if (searchInput) searchInput.value = '';
    filterPills.forEach(p => {
      if (p.getAttribute('data-category') === 'All') {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    applyFilters();
  }

  if (clearFilterBtn) clearFilterBtn.addEventListener('click', resetAllFilters);
  if (resetAllFiltersBtn) resetAllFiltersBtn.addEventListener('click', resetAllFilters);

  /* ==========================================================================
     4. Wishlist Favorites (Heart Icon Toggle & LocalStorage)
     ========================================================================== */
  const wishlistStorageKey = 'roamhaven_wishlist';
  const getSavedWishlist = () => {
    try {
      return JSON.parse(localStorage.getItem(wishlistStorageKey)) || [];
    } catch {
      return [];
    }
  };

  const saveWishlist = (list) => {
    localStorage.setItem(wishlistStorageKey, JSON.stringify(list));
  };

  const savedList = getSavedWishlist();

  // Highlight previously saved hearts on load
  document.querySelectorAll('.wishlist-btn, .wishlist-btn-show').forEach(btn => {
    const listingId = btn.getAttribute('data-listing-id');
    const icon = btn.querySelector('.heart-icon');
    if (listingId && savedList.includes(listingId) && icon) {
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid', 'text-danger');
      btn.classList.add('active');
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentList = getSavedWishlist();
      const isLiked = currentList.includes(listingId);

      if (isLiked) {
        const nextList = currentList.filter(id => id !== listingId);
        saveWishlist(nextList);
        if (icon) {
          icon.classList.remove('fa-solid', 'text-danger');
          icon.classList.add('fa-regular');
        }
        btn.classList.remove('active');
      } else {
        currentList.push(listingId);
        saveWishlist(currentList);
        if (icon) {
          icon.classList.remove('fa-regular');
          icon.classList.add('fa-solid', 'text-danger');
          btn.classList.add('active', 'heart-pop');
          setTimeout(() => btn.classList.remove('heart-pop'), 400);
        }
      }
    });
  });

  /* ==========================================================================
     5. Live Image Upload Preview
     ========================================================================== */
  const imageUploadInput = document.getElementById('imageUploadInput');
  const imagePreviewBox = document.getElementById('imagePreviewBox');
  const imagePreviewTarget = document.getElementById('imagePreviewTarget');

  if (imageUploadInput && imagePreviewBox && imagePreviewTarget) {
    imageUploadInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreviewTarget.src = e.target.result;
          imagePreviewBox.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
      } else {
        imagePreviewBox.classList.add('d-none');
      }
    });
  }

  /* ==========================================================================
     6. Password Visibility Toggle
     ========================================================================== */
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.input-group');
      const input = parent ? parent.querySelector('.password-input') : null;
      const icon = btn.querySelector('i');

      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          }
        } else {
          input.type = 'password';
          if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        }
      }
    });
  });

  /* ==========================================================================
     7. Share Haven Button (Copy URL)
     ========================================================================== */
  const shareBtn = document.getElementById('shareHavenBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const originalHtml = shareBtn.innerHTML;
        shareBtn.innerHTML = '<i class="fa-solid fa-check text-success me-2"></i> Link Copied!';
        setTimeout(() => {
          shareBtn.innerHTML = originalHtml;
        }, 2500);
      } catch {
        alert('Haven link: ' + window.location.href);
      }
    });
  }

  /* ==========================================================================
     8. Show Page Sticky Booking Dynamic Calculations
     ========================================================================== */
  const checkinInput = document.getElementById('bookingCheckin');
  const checkoutInput = document.getElementById('bookingCheckout');
  const numNightsText = document.getElementById('numNightsText');
  const baseTotalText = document.getElementById('baseTotalText');
  const taxTotalText = document.getElementById('taxTotalText');
  const grandTotalText = document.getElementById('grandTotalText');
  const reserveBtn = document.getElementById('reserveBtn');

  if (checkinInput && checkoutInput && typeof listing !== 'undefined' && listing) {
    const pricePerNight = listing.price || 0;

    function recalculateBooking() {
      const d1 = new Date(checkinInput.value);
      const d2 = new Date(checkoutInput.value);
      let nights = 5;

      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        nights = diffDays > 0 ? diffDays : 1;
      }

      const basePrice = pricePerNight * nights;
      const cleaningFee = 1200;
      const serviceFee = 950;
      const taxAmount = Math.round(basePrice * 0.18);
      const grandTotal = basePrice + cleaningFee + serviceFee + taxAmount;

      if (numNightsText) numNightsText.textContent = nights;
      if (baseTotalText) baseTotalText.textContent = '₹ ' + basePrice.toLocaleString('en-IN');
      if (taxTotalText) taxTotalText.textContent = '₹ ' + taxAmount.toLocaleString('en-IN');
      if (grandTotalText) grandTotalText.textContent = '₹ ' + grandTotal.toLocaleString('en-IN');
    }

    checkinInput.addEventListener('change', recalculateBooking);
    checkoutInput.addEventListener('change', recalculateBooking);
  }

  // Reservation Modal Trigger
  if (reserveBtn) {
    reserveBtn.addEventListener('click', () => {
      const modalEl = document.getElementById('reservationModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      } else {
        alert('Reservation request received! The host will contact you shortly.');
      }
    });
  }

  /* ==========================================================================
     9. Auto-dismiss Toast Notifications
     ========================================================================== */
  document.querySelectorAll('.alert-custom').forEach(alertBox => {
    setTimeout(() => {
      alertBox.classList.add('animate-fade-out');
      setTimeout(() => {
        alertBox.remove();
      }, 500);
    }, 4500);
  });

})();