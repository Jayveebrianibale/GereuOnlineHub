import { StyleSheet, Text, View } from 'react-native';
import { PasswordStrength, getPasswordStrengthColor, getPasswordStrengthLabel } from '../utils/passwordStrength';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  showFeedback?: boolean;
}

export default function PasswordStrengthIndicator({ 
  strength, 
  showFeedback = true 
}: PasswordStrengthIndicatorProps) {
  const { score, feedback, requirements } = strength;
  const strengthLabel = getPasswordStrengthLabel(score);
  const strengthColor = getPasswordStrengthColor(score);

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.strengthBarContainer}>
        <View style={styles.strengthBar}>
          {[1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[
                styles.strengthBarSegment,
                {
                  backgroundColor: level <= score ? strengthColor : '#E5E7EB',
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.strengthLabel, { color: strengthColor }]}>
          {strengthLabel}
        </Text>
      </View>

      {/* Requirements Checklist */}
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        {Object.entries(requirements).map(([key, met]) => (
          <View key={key} style={styles.requirementItem}>
            <View style={[
              styles.requirementIcon,
              { backgroundColor: met ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.requirementIconText}>
                {met ? '✓' : '✗'}
              </Text>
            </View>
            <Text style={[
              styles.requirementText,
              { color: met ? '#10B981' : '#EF4444' }
            ]}>
              {getRequirementLabel(key)}
            </Text>
          </View>
        ))}
      </View>

      {/* Feedback Messages */}
      {showFeedback && feedback.length > 0 && (
        <View style={styles.feedbackContainer}>
          {feedback.map((message, index) => (
            <Text key={index} style={styles.feedbackText}>
              • {message}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const getRequirementLabel = (key: string): string => {
  switch (key) {
    case 'length':
      return 'At least 8 characters';
    case 'lowercase':
      return 'One lowercase letter';
    case 'uppercase':
      return 'One uppercase letter';
    case 'number':
      return 'One number';
    case 'specialChar':
      return 'One special character';
    default:
      return key;
  }
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strengthBar: {
    flexDirection: 'row',
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 12,
  },
  strengthBarSegment: {
    flex: 1,
    marginRight: 2,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
  },
  requirementsContainer: {
    marginBottom: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  requirementIconText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 11,
    fontWeight: '500',
  },
  feedbackContainer: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  feedbackText: {
    fontSize: 11,
    color: '#DC2626',
    marginBottom: 2,
    lineHeight: 14,
  },
});
