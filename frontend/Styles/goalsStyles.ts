import { StyleSheet } from "react-native";
const goalsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#312d69",
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#312d69",
  },
  cardText: {
    fontSize: 15,
    marginBottom: 10,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#ff9800",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4caf50",
  },
  progressText: {
    fontSize: 14,
    marginTop: 5,
    color: "#666",
  },
  aportContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  aportButton: {
    backgroundColor: "#312d69",
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  aportButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default goalsStyles;
