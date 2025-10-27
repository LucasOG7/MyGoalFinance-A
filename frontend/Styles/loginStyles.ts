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
    backgroundColor: "rgba(255, 255, 255, 0.95)", // Fondo semi-transparente
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
    alignSelf: 'center',
    marginVertical: 20,
    // Efecto de textura con múltiples sombras internas
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    // Gradiente sutil simulado con overlay
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
    textShadowColor: "rgba(255, 255, 255, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  input: {
    height: 50,
    borderColor: "rgba(221, 221, 221, 0.6)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  loginButton: {
    backgroundColor: "#f5a623", // Amarillo corporativo
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#f5a623",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
