import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  // la pantalla completa pueda crecer y scrollear
  container: {
    flex: 1,
    // quita el centrado forzado
    // justifyContent: "center",
    // alignItems: "center",
  },

  // card flexible, sin altura fija, con márgenes en lugar de width fijo
  box: {
    width: "90%",
    padding: 30,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center', // Asegura que esté centrado
    marginVertical: 20, // Espacio vertical para mejor centrado
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 22,
  },

  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12, marginBottom: 10 },

  registerButton: {
    backgroundColor: "#f5a623",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  loginButton: { marginTop: 16, paddingVertical: 10, alignItems: "center" },
  loginButtonText: { color: "#1a1a1a", fontSize: 14 },
});

export default styles;
