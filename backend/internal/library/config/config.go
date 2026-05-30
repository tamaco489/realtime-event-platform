package config

import (
	"fmt"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	App      AppConfig
	Producer ProducerConfig
}

type AppConfig struct {
	Env         Environment `env:"APP_ENV,required,notEmpty"`
	Port        string      `env:"APP_PORT,required,notEmpty"`
	ServiceName string      `env:"API_SERVICE_NAME,required,notEmpty"`
}

type ProducerConfig struct {
	QueueURL string `env:"SQS_QUEUE_URL"`
}

func Load() (*Config, error) {
	cfg, err := env.ParseAs[Config]()
	if err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}
	return &cfg, nil
}
