import { StyleSheet } from "react-native";

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 4,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default headerStyles;
