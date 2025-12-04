import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 16, 
        backgroundColor: "#FBF7F1",
    },
    dateHeader: { 
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20 
    },
    dateText: { 
        fontSize: 15, 
        fontWeight: "bold", 
        color: "#FFFFFF",
        padding: 10,
        paddingHorizontal: 20,
        backgroundColor: '#c58c6d',
        borderRadius: 50,
        shadowColor: "#000", 
        shadowOpacity: 0.1, 
        shadowRadius: 10, 
        elevation: 2          
    },
    achievementsBtn: {
        padding: 10, 
        backgroundColor: "#DDBEA9", 
        borderRadius: 50,
        shadowColor: "#000", 
        shadowOpacity: 0.1, 
        shadowRadius: 10, 
        elevation: 2  
    },
    achievementIcon: {
        height: 24,
        width: 24
    },
    card: { 
        backgroundColor: "#FFFFFF", 
        borderRadius: 18, 
        marginBottom: 20, 
        shadowColor: "#000", 
        shadowOpacity: 0.1, 
        shadowRadius: 10, 
        elevation: 2 
    },
    cardHeader: { 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: 16, 
        backgroundColor: "#C3C6B1", 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20 
    },
    cardHeaderText: { 
        fontSize: 16, 
        fontWeight: "bold", 
        color: "#fff" 
    },
    cardContent: { 
        padding: 16 
    },
    instructionText: { 
        fontSize: 14, 
        color: "#333", 
        marginBottom: 12 
    },
    taskCard: { 
        padding: 12, 
        backgroundColor: "#f9f9f9", 
        borderRadius: 8, 
        marginBottom: 12, 
        shadowColor: "#000", 
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 2 },
    taskCardTitle: { 
        fontSize: 14, 
        fontWeight: "bold", 
        color: "#333" 
    },
    taskCardSubtitle: { 
        fontSize: 12, 
        color: "#666" 
    },
    techniqueButton: { 
        flex: 1, 
        padding: 12, 
        margin: 4, 
        borderWidth: 1, 
        borderColor: "#007BFF", 
        borderRadius: 8, 
        alignItems: "center", 
        justifyContent: "center" 
    },
    techniqueSelected: { 
        backgroundColor: "#007BFF" 
    },
    techniqueText: { 
        fontSize: 14, 
        color: "#007BFF" 
    },
    techniqueTextSelected: { 
        color: "#fff" 
    },
    timerSurface: {
        marginTop: 20,
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#FFF3E0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      timerTitle: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#333",
      },
      timerStatus: {
        fontSize: 14,
        color: "#555",
        flex: 1,
        marginHorizontal: 10,
      },
  });

export default styles;