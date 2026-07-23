/**
 * Formulaire de contact sans serveur : au clic sur « Envoyer », on ouvre
 * l'application e-mail du visiteur avec un message pré-rempli, adressé au club.
 */
(function () {
  function init() {
    var form = document.querySelector(".contact-form[data-mailto]");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var to = form.getAttribute("data-mailto");
      var val = function (name) {
        var el = form.querySelector('[name="' + name + '"]');
        return el ? el.value.trim() : "";
      };
      var subjectField = form.querySelector('[name="subject"]');
      var sujet =
        subjectField && subjectField.selectedOptions && subjectField.selectedOptions[0]
          ? subjectField.selectedOptions[0].text
          : val("subject");
      if (sujet === "— Choisis un sujet —") sujet = "";

      var prenom = val("firstname");
      var nom = val("lastname");
      var subject = "[Site MHB] " + (sujet || "Message") +
        (prenom || nom ? " — " + (prenom + " " + nom).trim() : "");
      var body =
        "Prénom : " + prenom + "\n" +
        "Nom : " + nom + "\n" +
        "Email : " + val("email") + "\n" +
        "Téléphone : " + val("phone") + "\n" +
        "Sujet : " + sujet + "\n\n" +
        val("message") + "\n";

      window.location.href =
        "mailto:" + to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
