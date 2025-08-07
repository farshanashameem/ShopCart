
  const categorySlideIndex = {
    female: 0,
    male: 0
  };

  function slideCategory(gender, direction) {
    const slider = document.getElementById(`category-slider-${gender}`);
    const totalItems = slider.children.length;
    const itemsPerSlide = 5;

    const maxIndex = Math.ceil(totalItems / itemsPerSlide) - 1;
    categorySlideIndex[gender] += direction;

    if (categorySlideIndex[gender] < 0) categorySlideIndex[gender] = 0;
    if (categorySlideIndex[gender] > maxIndex) categorySlideIndex[gender] = maxIndex;

    const slideWidth = slider.clientWidth;
    const shift = categorySlideIndex[gender] * 100;

    slider.style.transform = `translateX(-${shift}%)`;
  }

  function switchCategory(gender) {
    document.querySelectorAll('.category-section').forEach(el => el.style.display = 'none');
    document.getElementById('category-' + gender).style.display = 'block';

    // Reset slide position when switching
    categorySlideIndex[gender] = 0;
    const slider = document.getElementById(`category-slider-${gender}`);
    if (slider) slider.style.transform = `translateX(0%)`;

      document.querySelectorAll('.btn-group .btn').forEach(btn => {
    btn.classList.remove('btn-dark');
    btn.classList.add('btn-outline-dark');
  });
  }
  
function switchArrivals(gender) {
 document.querySelectorAll('.arrival-section').forEach(el => el.style.display = 'none');
    document.getElementById('arrival-' + gender).style.display = 'block';

    // Reset slide position when switching
    categorySlideIndex[gender] = 0;
    const slider = document.getElementById(`category-slider-${gender}`);
    if (slider) slider.style.transform = `translateX(0%)`;
  // Optional: button active toggle
  document.querySelectorAll('.btn-group .btn').forEach(btn => {
    btn.classList.remove('btn-dark');
    btn.classList.add('btn-outline-dark');
  });

  // Highlight selected gender's button
  const btn = document.querySelector(`button[onclick="switchArrivals('${gender}')"]`);
  if (btn) {
    btn.classList.remove('btn-outline-dark');
    btn.classList.add('btn-dark');
  }
}

 function slideArrival(gender, direction) {
    const slider = document.getElementById(`arrival-slider-${gender}`);
    const totalItems = slider.children.length;
    const itemsPerSlide = 5;

    const maxIndex = Math.ceil(totalItems / itemsPerSlide) - 1;
    categorySlideIndex[gender] += direction;

    if (categorySlideIndex[gender] < 0) categorySlideIndex[gender] = 0;
    if (categorySlideIndex[gender] > maxIndex) categorySlideIndex[gender] = maxIndex;

    const slideWidth = slider.clientWidth;
    const shift = categorySlideIndex[gender] * 100;

    slider.style.transform = `translateX(-${shift}%)`;
  }