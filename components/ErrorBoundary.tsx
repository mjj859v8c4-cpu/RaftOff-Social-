import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { colors } from "@/lib/theme";
import { logger } from "@/lib/logging";
import { captureException } from "@/lib/crashReporting";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("ErrorBoundary", { error, info });
    captureException(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something broke</Text>
          <Text style={styles.body}>{this.state.error.message}</Text>
          <Pressable style={styles.btn} onPress={() => this.setState({ error: null })}>
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  body: { color: colors.muted, textAlign: "center" },
  btn: {
    backgroundColor: colors.action,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
