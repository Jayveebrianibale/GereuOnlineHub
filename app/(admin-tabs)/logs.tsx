// ========================================
// ADMIN LOGS TAB - MOBILE-FRIENDLY REDESIGN
// ========================================

import { useColorScheme } from '@/components/ColorSchemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { clearOldLogs, deleteLog, getLogs, getLogStats, LOG_ACTIONS, LogEntry } from '../services/logsService';

// Clean color scheme for mobile
const colorPalette = {
    lightest: '#C3F5FF',
    light: '#7FE6FF',
    primaryLight: '#4AD0FF',
    primary: '#cb044dff',
    primaryDark: '#007BE5',
    dark: '#0051C1',
    darker: '#002F87',
    darkest: '#001A5C',
};

export default function AdminLogs() {
    const { colorScheme } = useColorScheme();
    const { user, role } = useAuthContext();

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'login' | 'logout'>('all');

    const isDark = colorScheme === 'dark';
    const bgColor = isDark ? '#121212' : '#fff';
    const cardBgColor = isDark ? '#1E1E1E' : '#fff';
    const textColor = isDark ? '#fff' : colorPalette.darkest;
    const subtitleColor = isDark ? colorPalette.primaryLight : colorPalette.dark;
    const borderColor = isDark ? '#333' : '#eee';

    // Load data
    useEffect(() => {
        loadLogs();
        loadStats();
    }, []);

    // Filter logs based on search and filter
    const filteredLogs = logs.filter(log => {
        const matchesSearch = searchQuery === '' ||
            log.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === 'all' || log.action === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    const loadLogs = async () => {
        try {
            setIsLoading(true);
            const logsData = await getLogs({}, 100);
            setLogs(logsData);
        } catch (error) {
            console.error('Error loading logs:', error);
            Alert.alert('Error', 'Failed to load logs');
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await getLogStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([loadLogs(), loadStats()]);
        setIsRefreshing(false);
    };

    const handleClearOldLogs = async () => {
        Alert.alert(
            'Clear Old Logs',
            'Delete logs older than 30 days?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const deletedCount = await clearOldLogs(30);
                            Alert.alert('Success', `Cleared ${deletedCount} old logs`);
                            await loadLogs();
                            await loadStats();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear logs');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteLog = async (logId: string) => {
        Alert.alert(
            'Delete Log',
            'Delete this log entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteLog(logId);
                            await loadLogs();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete log');
                        }
                    },
                },
            ]
        );
    };

    // Render log item as card
    const renderLogItem = ({ item }: { item: LogEntry }) => {
        const isLogin = item.action === LOG_ACTIONS.LOGIN;
        const isAdmin = item.userRole === 'admin';

        return (
            <View style={[styles.logCard, { backgroundColor: cardBgColor, borderColor: borderColor }]}>
                <View style={styles.logHeader}>
                    <View style={styles.userInfo}>
                        <ThemedText style={[styles.userEmail, { color: textColor }]} numberOfLines={1}>
                            {item.userEmail}
                        </ThemedText>
                        <View style={[styles.roleBadge, { backgroundColor: isAdmin ? '#F44336' : colorPalette.primary }]}>
                            <ThemedText style={styles.roleText}>
                                {isAdmin ? 'ADMIN' : 'USER'}
                            </ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteLog(item.id)}
                    >
                        <MaterialIcons name="delete-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
                </View>

                <View style={styles.logDetails}>
                    <View style={styles.actionBadge}>
                        <MaterialIcons
                            name={isLogin ? "login" : "logout"}
                            size={14}
                            color={isLogin ? '#4CAF50' : '#F44336'}
                        />
                        <ThemedText style={[styles.actionText, { color: isLogin ? '#4CAF50' : '#F44336' }]}>
                            {isLogin ? 'LOGIN' : 'LOGOUT'}
                        </ThemedText>
                    </View>

                    <View style={styles.timeInfo}>
                        <ThemedText style={[styles.dateText, { color: subtitleColor }]}>
                            {item.date}
                        </ThemedText>
                        <ThemedText style={[styles.timeText, { color: subtitleColor }]}>
                            {item.time}
                        </ThemedText>
                    </View>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colorPalette.primary} />
                    <ThemedText style={[styles.loadingText, { color: textColor }]}>Loading logs...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
            <FlatList
                data={filteredLogs}
                renderItem={renderLogItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[colorPalette.primary]}
                        tintColor={colorPalette.primary}
                    />
                }
                ListHeaderComponent={
                    <>
                        {/* Header */}
                        <View style={styles.header}>
                            <ThemedText 
                                style={[styles.title, { color: textColor }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit={true}
                            >
                                Admin Login Activity
                            </ThemedText>
                            <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
                                Track admin email logins only
                            </ThemedText>
                        </View>

                        {/* Quick Stats */}
                        {stats && (
                            <View style={[styles.statsContainer, { backgroundColor: cardBgColor, borderColor: borderColor }]}>
                                <View style={styles.statRow}>
                                    <View style={styles.statItem}>
                                        <ThemedText style={[styles.statNumber, { color: textColor }]}>{stats.todayLogins}</ThemedText>
                                        <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>Today</ThemedText>
                                    </View>
                                    <View style={styles.statItem}>
                                        <ThemedText style={[styles.statNumber, { color: textColor }]}>{stats.loginCount}</ThemedText>
                                        <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>Total</ThemedText>
                                    </View>
                                    <View style={styles.statItem}>
                                        <ThemedText style={[styles.statNumber, { color: textColor }]}>{stats.adminLogins}</ThemedText>
                                        <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>Admin Emails</ThemedText>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Search and Filters */}
                        <View style={[styles.controlsContainer, { backgroundColor: cardBgColor, borderColor: borderColor }]}>
                            {/* Search Bar */}
                            <View style={[styles.searchContainer, { borderColor: borderColor }]}>
                                <MaterialIcons name="search" size={20} color={subtitleColor} />
                                <TextInput
                                    style={[styles.searchInput, { color: textColor, backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
                                    placeholder="Search admin emails..."
                                    placeholderTextColor={subtitleColor}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <MaterialIcons name="clear" size={18} color={subtitleColor} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Filter Buttons */}
                            <View style={styles.filterContainer}>
                                {['all', 'login', 'logout'].map((filter) => (
                                    <TouchableOpacity
                                        key={filter}
                                        style={[
                                            styles.filterButton,
                                            selectedFilter === filter && styles.filterButtonActive,
                                            { 
                                                backgroundColor: selectedFilter === filter ? colorPalette.primary : 'transparent',
                                                borderColor: borderColor
                                            }
                                        ]}
                                        onPress={() => setSelectedFilter(filter as any)}
                                    >
                                        <ThemedText style={[
                                            styles.filterButtonText,
                                            { color: selectedFilter === filter ? '#FFFFFF' : subtitleColor }
                                        ]}>
                                            {filter.toUpperCase()}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Admin Actions */}
                            <TouchableOpacity
                                style={[styles.adminButton, { backgroundColor: '#FF6B35' }]}
                                onPress={handleClearOldLogs}
                            >
                                <MaterialIcons name="delete-sweep" size={18} color="#FFFFFF" />
                                <ThemedText style={styles.adminButtonText}>Clear Old Logs</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Results Count */}
                        <View style={styles.resultsHeader}>
                            <ThemedText style={[styles.resultsText, { color: subtitleColor }]}>
                                {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
                            </ThemedText>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="history" size={64} color={subtitleColor} />
                        <ThemedText style={[styles.emptyText, { color: textColor }]}>No logs found</ThemedText>
                        <ThemedText style={[styles.emptySubtext, { color: subtitleColor }]}>
                            {searchQuery ? 'Try a different search' : 'No login activity yet'}
                        </ThemedText>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 20,
    },
    header: {
        padding: 20,
        paddingBottom: 24,
        marginTop: 30,
        minHeight: 80,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 36,
        includeFontPadding: false,
        textAlignVertical: 'center',
        paddingTop: 4,
        paddingBottom: 4,
    },
    subtitle: {
        fontSize: 16,
    },
    statsContainer: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    controlsContainer: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    filterButtonActive: {
        borderColor: colorPalette.primary,
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    adminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    adminButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    resultsHeader: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    resultsText: {
        fontSize: 14,
        fontWeight: '500',
    },
    logCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userEmail: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: colorPalette.primary,
    },
    roleText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    deleteButton: {
        padding: 4,
    },
    logDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    timeInfo: {
        alignItems: 'flex-end',
    },
    dateText: {
        fontSize: 14,
        fontWeight: '500',
    },
    timeText: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});