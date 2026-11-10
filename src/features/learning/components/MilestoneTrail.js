import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@shared/config/theme';
import MilestoneNode, { milestoneState } from '@features/learning/components/MilestoneNode';

/** Compact horizontal journey: one dot per milestone, joined by a line filled up to the last reached. */
const MilestoneTrail = ({ milestones = [], color, size = 28, style }) => {
  const reached = milestones.filter((milestone) => milestone.reached).length;
  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityLabel={`${reached} of ${milestones.length} milestones reached`}
    >
      {milestones.map((milestone, index) => (
        <React.Fragment key={milestone.level}>
          {index > 0 && (
            <View style={[styles.line, { backgroundColor: milestone.reached ? color : colors.border }]} />
          )}
          <MilestoneNode
            state={milestoneState(milestones, index)}
            level={milestone.level}
            isLast={index === milestones.length - 1}
            color={color}
            size={size}
          />
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 3,
    marginHorizontal: 2,
    borderRadius: 2,
  },
});

export default MilestoneTrail;
