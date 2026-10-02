export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p style={styles.text}>
        © {new Date().getFullYear()} MDSolutions - Avaries Manager
      </p>
    </footer>
  );
}

const styles = {
  footer: {
    width: "100%",
    boxSizing: "border-box",
    padding: "18px 20px",
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    marginTop: 30,
  },

  text: {
    margin: 0,
  },
};
