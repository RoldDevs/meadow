import React, { useState } from "react";
import { StyleSheet, View, FlatList, Image } from "react-native";
import {Card, ProgressBar, Text} from "react-native-paper";


//dummy data here
import dummy_achievements from "../../Data/achievements.js"

const AchievementsScreen = () => {
  console.log(typeof(dummy_achievements));
  const [achievements, setAchievements] = useState(
    dummy_achievements
  );

  const renderAchievement = ({ item }) => {
    const progressPercentage = item.total ? parseInt(item.progress / item.total) : 0;

    return (

      <Card style={styles.achievementCard}>
          <Card.Title  
            title={item.title}
            subtitle={item.description}
            left={(props) => (
              <Image
                source={item.icon}
                style={styles.achievementIcon}
              />
            )}
          />
          <Card.Content>
            <ProgressBar progress={progressPercentage} style={styles.progressBar} />
            <Text style={styles.progressText}> 
              {item.progress}/{item.total} Completed
            </Text>
          </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>

      {/* Achievements List */}
      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.achievementList}
      />
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
  },
  achievementList: {
    paddingBottom: 20,
  },
  achievementCard: {
    marginBottom: 12, 
  },
  achievementIcon: {
    width: 50, 
    height: 50, 
    marginRight: 5,
  },
  progressBar: {
    height: 8,
    borderRadius: 5
  },
  progressText: {
    marginTop: 7,
  },
});

export default AchievementsScreen;
