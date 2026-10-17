// public/js/faqs.js
// Used ONLY by faqs.html.

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function loadFaqs() {
  const container = document.getElementById('faqsList');
  try {
    const res = await fetch('/api/faqs/public');
    const faqs = await res.json();

    if (faqs.length === 0) {
      container.innerHTML = '<p class="lede">No FAQs posted yet.</p>';
      return;
    }

    container.innerHTML = faqs.map((faq, idx) => `
      <div class="faq-item">
        <button class="faq-question" data-idx="${idx}">
          <span>${escapeHtml(faq.question)}</span>
          <span class="faq-caret">&#9662;</span>
        </button>
        <div class="faq-answer" id="faq-answer-${idx}">
          <p>${escapeHtml(faq.answer)}</p>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const answer = document.getElementById(`faq-answer-${btn.dataset.idx}`);
        const isOpen = answer.classList.toggle('open');
        btn.classList.toggle('open', isOpen);
      });
    });
  } catch (err) {
    container.innerHTML = '<p class="lede">Could not load right now.</p>';
  }
}

loadFaqs();
