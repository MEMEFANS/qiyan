(function () {
  const loadFragment = async (selector, url) => {
    const host = document.querySelector(selector);
    if (!host) return;

    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    host.innerHTML = await res.text();
  };

  const initYear = () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  const initMobileMenu = () => {
    const menuBtn = document.getElementById("menuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    if (!menuBtn || !mobileMenu) return;

    const setOpen = (open) => {
      mobileMenu.classList.toggle("hidden", !open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    };

    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      setOpen(!expanded);
    });

    mobileMenu.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.tagName === "A") setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  };

  const initNavActive = () => {
    const setActive = () => {
      const current = location.pathname.split("/").pop() || "index.html";
      const aboutSubPages = new Set([
        "about-overview.html",
        "about-story.html",
        "about-public.html",
        "about-locations.html",
        "about-center.html"
      ]);
      const programsSubPages = new Set([
        "program-kindergarten.html",
        "program-slt.html",
        "program-cognitive.html",
        "program-ot.html",
        "program-social.html"
      ]);
      const integrationSubPages = new Set(["integration.html", "integration-social.html"]);
      const newsSubPages = new Set([
        "news-topic.html",
        "news-qa.html",
        "news-knowledge.html",
        "news-info.html"
      ]);
      const contactSubPages = new Set(["contact-join.html"]);
      const eventsSubPages = new Set(["events-lighthouse.html", "events-spark.html"]);
      const isExpertDetail = /^expert-\d+\.html$/i.test(current);
      const isCaseDetail = /^case-\d+\.html$/i.test(current);
      const isNewsArticleDetail = /^news-article-\d+\.html$/i.test(current);
      const currentForNav = aboutSubPages.has(current)
        ? "about.html"
        : programsSubPages.has(current)
          ? "programs.html"
          : integrationSubPages.has(current)
            ? "integration.html"
            : newsSubPages.has(current)
              ? "news.html"
              : isNewsArticleDetail
                ? "news.html"
              : contactSubPages.has(current)
                ? "contact.html"
                : eventsSubPages.has(current)
                  ? "events.html"
                  : isExpertDetail
                    ? "experts.html"
                    : isCaseDetail
                      ? "cases.html"
          : current;
      const links = Array.from(document.querySelectorAll("a[data-nav][data-page]"));

      links.forEach((a) => {
        const navType = a.getAttribute("data-nav");
        const page = a.getAttribute("data-page");
        const isActive = page === currentForNav;

        if (navType === "pill") {
          a.classList.toggle("bg-brand-600", isActive);
          a.classList.toggle("text-white", isActive);
          a.classList.toggle("shadow-soft", isActive);
          a.classList.toggle("hover:bg-brand-700", true);
          return;
        }

        a.classList.toggle("text-brand-700", isActive);
        a.classList.toggle("font-bold", isActive);
        a.classList.toggle("text-slate-700", !isActive);
        a.classList.toggle("font-semibold", !isActive);
        a.classList.toggle("hover:text-brand-700", true);
      });
    };

    setActive();
  };

  const initBookingFormDemo = () => {
    const form = document.getElementById("bookingForm");
    const msg = document.getElementById("formMsg");

    if (!form || !msg) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const data = {
        parentName: String(fd.get("parentName") || "").trim(),
        childAge: String(fd.get("childAge") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        needs: String(fd.get("needs") || "").trim(),
        note: String(fd.get("note") || "").trim()
      };

      if (!data.parentName || !data.childAge || !data.phone || !data.needs) {
        msg.classList.remove("hidden");
        msg.textContent = "请先填写必填项。";
        return;
      }

      try {
        const res = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          msg.classList.remove("hidden");
          msg.textContent = "预约信息已成功提交！我们会尽快与您联系。";
          form.reset();
        } else {
          msg.textContent = "提交失败，请稍后再试。";
        }
      } catch (err) {
        msg.textContent = "网络请求失败，请检查您的网络连接。";
      }
    });
  };

  const init = async () => {
    try {
      await loadFragment("#siteHeader", "/partials/header.html");
      await loadFragment("#siteFooter", "/partials/footer.html");
    } catch (e) {
      return;
    }

    initYear();
    initMobileMenu();
    initNavActive();
    initBookingFormDemo();
  };

  init();
})();
