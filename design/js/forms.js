/* ========================================================
   The Culture N — Forms & Privacy Modal
   - Privacy policy popup (자세히 보기)
   - Form submission to /api/submit
   - Toast feedback
   ======================================================== */

(function () {
  'use strict';

  // ===== Privacy Policy Content =====
  const PRIVACY_HTML = `
    <h3>1. 개인정보 수집·이용 목적</h3>
    <p>(주)더컬쳐앤(이하 "회사")은 아래의 목적으로 개인정보를 수집·이용합니다. 수집한 정보는 명시된 목적 외 용도로 사용되지 않으며, 목적이 변경될 경우 사전에 동의를 받습니다.</p>
    <ul>
      <li>출판·공연·라운지·의료관광 등 서비스 상담 및 견적 안내</li>
      <li>본인 확인 및 회신을 위한 연락 (전화·카카오톡·이메일)</li>
      <li>맞춤형 서비스 제안을 위한 분야·관심사 분석</li>
      <li>마케팅 정보 발신 (수신 동의 시)</li>
    </ul>

    <h3>2. 수집 항목</h3>
    <table>
      <thead>
        <tr>
          <th style="width:30%">구분</th>
          <th>수집 항목</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>필수</strong></td>
          <td>성함, 연락처(휴대폰 번호)</td>
        </tr>
        <tr>
          <td><strong>선택</strong></td>
          <td>이메일, 분야(의료/법조/세무/교육/부모 자서전 등), 출간 희망 시기, 상담 메시지</td>
        </tr>
        <tr>
          <td><strong>자동 수집</strong></td>
          <td>접속 IP(보안 로그), 접속 일시, 광고 유입 출처(source)</td>
        </tr>
      </tbody>
    </table>

    <h3>3. 보유 및 이용 기간</h3>
    <p>수집된 개인정보는 <strong>상담 목적 달성 후 즉시 파기</strong>합니다. 단, 관계 법령에 따라 보존 의무가 있는 경우 해당 기간 동안 보관합니다.</p>
    <ul>
      <li>상담 문의 기록: <strong>2년</strong> (소비자기본법)</li>
      <li>계약·청약철회 기록: <strong>5년</strong> (전자상거래법)</li>
      <li>웹사이트 접속 기록: <strong>3개월</strong> (통신비밀보호법)</li>
    </ul>

    <h3>4. 제3자 제공</h3>
    <p>회사는 수집한 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에 한하여 동의 후 제공합니다.</p>
    <ul>
      <li>이용자가 사전에 동의한 경우</li>
      <li>법령에 의거하거나, 수사 목적으로 법정 절차에 따른 요청이 있는 경우</li>
    </ul>

    <h3>5. 처리 위탁</h3>
    <p>원활한 서비스 제공을 위해 다음과 같이 처리를 위탁할 수 있습니다.</p>
    <ul>
      <li>호스팅·서버: Vercel Inc. (배포·운영)</li>
      <li>이메일·알림: 카카오톡 비즈니스, 이메일 서비스 (회신 발송용)</li>
    </ul>

    <h3>6. 정보주체의 권리</h3>
    <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
    <ol>
      <li>개인정보 열람·정정·삭제 요구</li>
      <li>개인정보 처리 정지 요구</li>
      <li>마케팅 수신 동의 철회</li>
    </ol>
    <p>요청은 <strong>1994seojin@gmail.com</strong> 또는 <strong>02-734-3827</strong>로 문의 시 즉시 처리됩니다.</p>

    <h3>7. 개인정보 보호 책임자</h3>
    <div class="notice">
      <strong>개인정보 보호 책임자</strong>: 이서진 (대표)<br>
      <strong>이메일</strong>: 1994seojin@gmail.com<br>
      <strong>연락처</strong>: 02-734-3827<br>
      <strong>회사명</strong>: 주식회사 더컬쳐앤 (LSJ Company)
    </div>

    <h3>8. 동의 거부 권리</h3>
    <p>이용자는 위 개인정보 수집·이용 동의를 거부할 권리가 있습니다. 다만, 필수 항목에 동의하지 않으실 경우 상담 신청 서비스를 이용하실 수 없습니다.</p>

    <h3>9. 마케팅 정보 수신 (선택)</h3>
    <p>회사는 신규 패키지·이벤트·할인 정보 등 마케팅 자료를 카카오톡·이메일·SMS로 발송할 수 있습니다. 마케팅 수신 거부는 언제든 가능하며, 거부 시에도 상담 진행에는 영향이 없습니다.</p>

    <p style="margin-top:24px; padding-top:16px; border-top:1px solid var(--gray-line); font-size:12px; color:var(--gray);">
      <strong>시행일</strong>: 2026년 1월 1일 · <strong>최종 개정일</strong>: 2026년 5월 6일
    </p>
  `;

  // ===== Build Privacy Modal =====
  function ensurePrivacyModal() {
    if (document.querySelector('.privacy-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'privacy-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'privacy-modal-title');
    modal.innerHTML = `
      <div class="privacy-modal-backdrop" data-close></div>
      <div class="privacy-modal-dialog">
        <div class="privacy-modal-head">
          <div>
            <div class="eyebrow-mini">— Privacy Policy</div>
            <h2 id="privacy-modal-title">개인정보 수집·이용 동의</h2>
          </div>
          <button type="button" class="privacy-modal-close" data-close aria-label="닫기">×</button>
        </div>
        <div class="privacy-modal-body">${PRIVACY_HTML}</div>
        <div class="privacy-modal-foot">
          <button type="button" class="btn-close" data-close>닫기</button>
          <button type="button" class="btn-confirm" data-confirm>동의하고 계속</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close handlers
    modal.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => closePrivacyModal());
    });

    // Confirm handler
    modal.querySelector('[data-confirm]').addEventListener('click', () => {
      // Check the linked agreement checkbox if exists
      const linkedCheck = modal.dataset.linkedCheckbox;
      if (linkedCheck) {
        const cb = document.querySelector(linkedCheck);
        if (cb) cb.checked = true;
      }
      closePrivacyModal();
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closePrivacyModal();
      }
    });
  }

  function openPrivacyModal(linkedCheckboxSelector) {
    ensurePrivacyModal();
    const modal = document.querySelector('.privacy-modal');
    if (linkedCheckboxSelector) {
      modal.dataset.linkedCheckbox = linkedCheckboxSelector;
    } else {
      delete modal.dataset.linkedCheckbox;
    }
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Focus management
    setTimeout(() => {
      const closeBtn = modal.querySelector('.privacy-modal-close');
      if (closeBtn) closeBtn.focus();
    }, 100);
  }

  function closePrivacyModal() {
    const modal = document.querySelector('.privacy-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Auto-bind any link with data-privacy-link or [href*="privacy"] inside form labels
  function bindPrivacyLinks() {
    document.querySelectorAll('[data-privacy-link]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const linkedCheck = link.dataset.privacyTarget || null;
        openPrivacyModal(linkedCheck);
      });
    });

    // Also auto-bind anchors that look like a privacy link inside form
    document.querySelectorAll('form a[href="#privacy"], form a[href="#policy"]').forEach(link => {
      if (link.dataset.privacyBound) return;
      link.dataset.privacyBound = '1';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cb = link.closest('label')?.querySelector('input[type="checkbox"]');
        const sel = cb ? `#${cb.id}` : null;
        openPrivacyModal(sel || null);
      });
    });
  }

  // Expose globally
  window.openPrivacyModal = openPrivacyModal;
  window.closePrivacyModal = closePrivacyModal;

  // ===== Toast =====
  function showToast(message, type) {
    type = type || 'success';
    let toast = document.querySelector('.form-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'form-toast';
      document.body.appendChild(toast);
    }
    toast.className = `form-toast ${type}`;
    toast.innerHTML = `<span class="icon">${type === 'success' ? '✓' : '!'}</span><span>${message}</span>`;
    requestAnimationFrame(() => toast.classList.add('is-show'));
    setTimeout(() => {
      toast.classList.remove('is-show');
    }, 4500);
  }

  // ===== Form Submit Handler (POSTs to /api/submit) =====
  function bindForms() {
    document.querySelectorAll('form[data-form="lead"], form.tcn-form').forEach(form => {
      if (form.dataset.bound) return;
      form.dataset.bound = '1';

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate privacy agreement if exists
        const agree = form.querySelector('input[name="privacy_agree"]');
        if (agree && !agree.checked) {
          showToast('개인정보 수집·이용 동의에 체크해주세요.', 'error');
          openPrivacyModal(`#${agree.id}`);
          return;
        }

        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '전송 중…';
        }

        // Build payload
        const formData = new FormData(form);
        const payload = {};
        formData.forEach((v, k) => {
          if (payload[k] !== undefined) {
            payload[k] = [].concat(payload[k], v);
          } else {
            payload[k] = v;
          }
        });
        payload.source = payload.source || form.dataset.source || (location.pathname || '').replace(/^\/|\.html$/g, '') || 'unknown';
        payload.page_url = location.href;
        payload.user_agent = navigator.userAgent;

        try {
          const res = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          showToast('상담 신청이 접수되었습니다. 30분 내 회신드릴게요!', 'success');
          form.reset();
        } catch (err) {
          console.error('Form submit error:', err);
          showToast('전송에 실패했습니다. 카카오톡으로 연락주세요.', 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      });
    });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindPrivacyLinks();
      bindForms();
    });
  } else {
    bindPrivacyLinks();
    bindForms();
  }
})();
