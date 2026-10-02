export default function ConfirmModal({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{ background: "#fff", padding: 20 }}>
        <h3>Confirmer suppression ?</h3>

        <button onClick={onCancel}>Annuler</button>
        <button onClick={onConfirm} style={{ background: "red", color: "white" }}>
          Supprimer
        </button>
      </div>
    </div>
  );
}