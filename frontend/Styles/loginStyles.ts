import { StyleSheet } from "react-native";

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center", // Centra el box
  },
  box: {
    width: "90%",
    padding: 30,
    borderRadius: 20,
    backgroundColor: "#fff", // Cajita blanca elegante sobre el gradiente
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center', // Asegura que esté centrado
    marginVertical: 20, // Espacio vertical para mejor centrado
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  loginButton: {
    backgroundColor: "#f5a623", // Amarillo corporativo
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  registerButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  registerButtonText: {
    color: "#1a1a1a",
    fontSize: 14,
    textAlign: "center",
  },
});

export default loginStyles;
