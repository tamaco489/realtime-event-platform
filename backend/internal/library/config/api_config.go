package config

import (
	"fmt"

	"github.com/caarlos0/env/v11"
)

type APIConfig struct {
	App      APIAppConfig
	Producer ProducerConfig
}

type APIAppConfig struct {
	Env         Environment `env:"APP_ENV,required,notEmpty"`
	Port        string      `env:"APP_PORT,required,notEmpty"`
	ServiceName string      `env:"API_SERVICE_NAME,required,notEmpty"`
}

type ProducerConfig struct {
	QueueURL string `env:"SQS_QUEUE_URL"`
}

func APILoad() (*APIConfig, error) {
	cfg, err := env.ParseAs[APIConfig]()
	if err != nil {
		return nil, fmt.Errorf("parse api config: %w", err)
	}
	return &cfg, nil
}
