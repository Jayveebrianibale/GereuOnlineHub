import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

const colorPalette = {
  lightest: '#C3F5FF',
  light: '#7FE6FF',
  primaryLight: '#4AD0FF',
  primary: '#00B2FF',
  primaryDark: '#007BE5',
  dark: '#0051C1',
  darker: '#002F87',
  darkest: '#001A5C',
};

export default function AnalyticsScreen() {
  const { colorScheme } = useColorScheme();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#121212' : '#fff';
  const cardBgColor = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#fff' : colorPalette.darkest;
  const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
  const gridColor = isDark ? '#333' : '#eee';

  // Responsive sizing
  const cardHorizontalPadding = 52; // 16 left + 16 right
  const responsiveWidth = isPortrait ? width - 40 - cardHorizontalPadding : (width / 2) - 30 - cardHorizontalPadding;
  const cardWidth = isPortrait ? '32%' : '48%';
  const chartHeight = isPortrait ? 220 : 180;
  const pieChartHeight = isPortrait ? 180 : 160;
  const titleSize = width < 400 ? 20 : 24;
  const subtitleSize = width < 400 ? 12 : 14;

  // Chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const apartmentData = [20, 45, 28, 80, 99, 43];
  const laundryData = [30, 25, 35, 60, 70, 50];
  const motorPartsData = [10, 20, 15, 40, 55, 30];
  
  // Summary data
  const summaryData = [
    { name: "Total Bookings", value: 342, change: "+12%", icon: "event" },
    { name: "Revenue", value: "$28,450", change: "+8%", icon: "attach-money" },
    { name: "Active Users", value: "1,243", change: "+5%", icon: "people" },
  ];

  // Pie chart data
  const pieData = [
    { name: "Apartments", value: 45, color: colorPalette.primary, legendFontColor: textColor },
    { name: "Laundry", value: 30, color: colorPalette.dark, legendFontColor: textColor },
    { name: "Motor Parts", value: 25, color: colorPalette.primaryDark, legendFontColor: textColor },
  ];

  const chartConfig = {
    backgroundColor: cardBgColor,
    backgroundGradientFrom: cardBgColor,
    backgroundGradientTo: cardBgColor,
    decimalPlaces: 0,
    labelColor: () => textColor,
    barPercentage: 0.5,
    propsForBackgroundLines: {
      stroke: gridColor,
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: width < 400 ? 8 : 10,
    },
    color: (opacity = 1) => `rgba(0, 178, 255, ${opacity})`,
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer, 
          { padding: isPortrait ? 20 : 15 }
        ]}
      >
        {/* Header */}
        <View style={[
          styles.header, 
          { flexDirection: isPortrait ? 'row' : 'column', alignItems: 'flex-start' }
        ]}>
            <View style={{ marginTop: 20 }}>
            <ThemedText type="title" style={[
              styles.title, 
              { 
                color: textColor, 
                fontSize: titleSize,
                marginBottom: isPortrait ? 0 : 8
              }
            ]}>
              Analytics
            </ThemedText>
            <ThemedText type="default" style={[
              styles.subtitle, 
              { 
                color: subtitleColor, 
                fontSize: subtitleSize 
              }
            ]}>
              Performance insights and metrics
            </ThemedText>
          </View>
          <TouchableOpacity style={[
            styles.dateFilter, 
            { marginTop: isPortrait ? 25 : 12 }
          ]}>
            <ThemedText style={{ color: colorPalette.primary, fontSize: subtitleSize }}>
              Last 6 Months
            </ThemedText>
            <MaterialIcons name="arrow-drop-down" size={20} color={colorPalette.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards - Adjust layout for landscape */}
        <View style={[
          styles.summaryContainer, 
          { 
            flexDirection: isPortrait ? 'row' : 'column',
            marginBottom: isPortrait ? 20 : 15
          }
        ]}>
          {summaryData.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.summaryCard, 
                { 
                  backgroundColor: cardBgColor,
                  width: isPortrait ? cardWidth : '100%',
                  marginBottom: isPortrait ? 0 : 12,
                  marginRight: isPortrait ? 0 : index < 2 ? '2%' : 0
                }
              ]}
            >
              <MaterialIcons name={item.icon} size={24} color={colorPalette.primary} />
              <ThemedText type="default" style={[
                styles.summaryLabel, 
                { color: subtitleColor, fontSize: subtitleSize }
              ]}>
                {item.name}
              </ThemedText>
              <ThemedText type="title" style={[
                styles.summaryValue, 
                { 
                  color: textColor,
                  fontSize: width < 400 ? 16 : 18
                }
              ]}>
                {item.value}
              </ThemedText>
              <View style={styles.changeContainer}>
                <ThemedText style={[
                  styles.changeText, 
                  { 
                    color: item.change.startsWith('+') ? '#10B981' : '#EF4444',
                    fontSize: subtitleSize
                  }
                ]}>
                  {item.change}
                </ThemedText>
                <MaterialIcons 
                  name={item.change.startsWith('+') ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={item.change.startsWith('+') ? '#10B981' : '#EF4444'} 
                />
              </View>
            </View>
          ))}
        </View>

        {/* Charts Container - Adjust layout for landscape */}
        <View style={!isPortrait && styles.landscapeChartsContainer}>
          {/* Revenue Trend Chart */}
          <View style={[
            styles.chartCard, 
            { 
              backgroundColor: cardBgColor,
              width: isPortrait ? '100%' : '48%',
              marginRight: !isPortrait && 15
            }
          ]}>
            <View style={styles.chartHeader}>
              <ThemedText type="subtitle" style={[
                styles.chartTitle, 
                { 
                  color: textColor,
                  fontSize: width < 400 ? 14 : 16
                }
              ]}>
                Revenue Trend
              </ThemedText>
              <TouchableOpacity>
                <ThemedText style={{ 
                  color: colorPalette.primary, 
                  fontSize: width < 400 ? 10 : 12 
                }}>
                  View Details
                </ThemedText>
              </TouchableOpacity>
            </View>
            <LineChart
              data={{
                labels: months,
                datasets: [
                  {
                    data: [5000, 8500, 6000, 12000, 15000, 11000],
                    color: (opacity = 1) => `rgba(0, 178, 255, ${opacity})`,
                  },
                ],
              }}
              width={responsiveWidth}
              height={chartHeight}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          </View>

          {/* Service Distribution - Only show in portrait or as second column in landscape */}
          {isPortrait ? (
            <View style={[styles.chartCard, { backgroundColor: cardBgColor }]}>
              <ThemedText type="subtitle" style={[
                styles.chartTitle, 
                { 
                  color: textColor,
                  fontSize: width < 400 ? 14 : 16
                }
              ]}>
                Service Distribution
              </ThemedText>
              <PieChart
                data={pieData}
                width={responsiveWidth}
                height={pieChartHeight}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={styles.chartStyle}
              />
            </View>
          ) : (
            <View style={[styles.chartCard, { 
              backgroundColor: cardBgColor,
              width: '48%'
            }]}>
              <ThemedText type="subtitle" style={[
                styles.chartTitle, 
                { 
                  color: textColor,
                  fontSize: width < 400 ? 14 : 16
                }
              ]}>
                Service Distribution
              </ThemedText>
              <PieChart
                data={pieData}
                width={responsiveWidth}
                height={pieChartHeight}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={styles.chartStyle}
              />
            </View>
          )}
        </View>

        {/* Service Comparison - Full width in both orientations */}
        <View style={[styles.chartCard, { backgroundColor: cardBgColor }]}>
          <ThemedText type="subtitle" style={[
            styles.chartTitle, 
            { 
              color: textColor,
              fontSize: width < 400 ? 14 : 16
            }
          ]}>
            Service Comparison
          </ThemedText>
          <BarChart
            data={{
              labels: months,
              datasets: [
                {
                  data: apartmentData,
                  color: () => colorPalette.primary,
                },
                {
                  data: laundryData,
                  color: () => colorPalette.dark,
                },
                {
                  data: motorPartsData,
                  color: () => colorPalette.primaryDark,
                },
              ],
            }}
            width={responsiveWidth}
            height={chartHeight}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            fromZero
            showBarTops={false}
            withCustomBarColorFromData
            flatColor
          />
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colorPalette.primary }]} />
              <ThemedText style={[
                styles.legendText, 
                { 
                  color: textColor,
                  fontSize: width < 400 ? 10 : 12
                }
              ]}>
                Apartments
              </ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colorPalette.dark }]} />
              <ThemedText style={[
                styles.legendText, 
                { 
                  color: textColor,
                  fontSize: width < 400 ? 10 : 12
                }
              ]}>
                Laundry
              </ThemedText>
            </View>
            <View style={styles.legendIte}>
              <View style={[styles.legendColor, { backgroundColor: colorPalette.primaryDark }]} />
              <ThemedText style={[
                styles.legendText, 
                { 
                  color: textColor,
                  fontSize: width < 400 ? 10 : 12
                }
              ]}>
                Motor Parts
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.8,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colorPalette.primary,
  },
  summaryContainer: {
    justifyContent: 'space-between',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryLabel: {
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: '600',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    marginRight: 4,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontWeight: '600',
  },
  chartStyle: {
    borderRadius: 8,
    marginTop: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
  },
  landscapeChartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});