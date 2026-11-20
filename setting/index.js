// Settings page shown in the Zepp app on the phone
// (Profil -> GTR 3 -> App-Einstellungen -> Tennis Tracker).
// Values are stored in settingsStorage and read by the side service.

const HINT = { fontSize: "13px", color: "#666", marginTop: "14px", marginBottom: "4px" };

AppSettingsPage({
  build(props) {
    const store = props.settingsStorage;
    const url = store.getItem("scriptUrl") || "";
    const token = store.getItem("token") || "";
    const last = store.getItem("lastResult") || "";

    return View({ style: { padding: "12px 20px" } }, [
      Text({ bold: true, paragraph: true, style: { fontSize: "18px" } }, "Google Sheets Export"),
      Text(
        { paragraph: true, style: HINT },
        "Web-App-URL des Google Apps Scripts (endet auf /exec). Anleitung: README im Projekt."
      ),
      TextInput({
        label: "Script-URL",
        value: url,
        placeholder: "https://script.google.com/macros/s/.../exec",
        maxLength: 500,
        onChange: (val) => store.setItem("scriptUrl", String(val || "").trim()),
      }),
      Text({ paragraph: true, style: HINT }, "Token: dasselbe Wort wie TOKEN im Script."),
      TextInput({
        label: "Token",
        value: token,
        maxLength: 100,
        onChange: (val) => store.setItem("token", String(val || "").trim()),
      }),
      Text(
        { paragraph: true, style: HINT },
        "Status: " + (url ? "URL gesetzt" : "keine URL gesetzt") + (token ? ", Token gesetzt" : ", kein Token")
      ),
      Text({ paragraph: true, style: HINT }, "Letzter Export: " + (last || "noch keiner")),
    ]);
  },
});
