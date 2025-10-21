import { StyleSheet } from "react-native";
const recapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  item: {
    fontSize: 16,
    marginBottom: 12,
    color: "#333",
  },
  label: {
    fontWeight: "600",
    color: "#312d69",
  },
  recommendation: {
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: "100%",
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff9800",
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#ff9800",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 5,
  },
  cancelText: {
    color: "white",
    fontSize: 15,
  },
});
export default recapStyles;
