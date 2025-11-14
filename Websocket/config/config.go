package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	WsSecret      string
	AllowedOrigin string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️  No se pudo cargar .env, usando variables del entorno")
	}

	cfg := &Config{
		Port:          getEnv("PORT", "8081"),
		WsSecret:      getEnv("WS_SECRET", ""),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "*"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

