import React, { useState } from "react";
import { Image, ImageProps, StyleSheet, View, ActivityIndicator } from "react-native";
import { colors } from "@/lib/theme";

/** Lazy-loading image with placeholder — only mounts remote URI when visible/requested */
export function LazyImage({
  uri,
  style,
  ...rest
}: { uri?: string | null } & Omit<ImageProps, "source">) {
  const [loaded, setLoaded] = useState(false);
  if (!uri) {
    return <View style={[styles.ph, style]} />;
  }
  return (
    <View style={style}>
      {!loaded ? (
        <View style={[StyleSheet.absoluteFill, styles.ph]}>
          <ActivityIndicator color={colors.muted} />
        </View>
      ) : null}
      <Image
        {...rest}
        source={{ uri }}
        style={[style, !loaded && styles.hidden]}
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ph: {
    backgroundColor: "#0E1A24",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  hidden: { opacity: 0 },
});
