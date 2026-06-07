package config

import (
	"fmt"

	"github.com/caarlos0/env/v11"
)

type APIConfig struct {
	App      APIAppConfig
	Producer ProducerConfig
	Auth     AuthConfig
}

type APIAppConfig struct {
	Env         Environment `env:"APP_ENV,required,notEmpty"`
	Port        string      `env:"APP_PORT,required,notEmpty"`
	ServiceName string      `env:"API_SERVICE_NAME,required,notEmpty"`
}

type ProducerConfig struct {
	QueueURL string `env:"SQS_QUEUE_URL,required,notEmpty"`
}

type AuthConfig struct {
	Region     string `env:"COGNITO_REGION,required,notEmpty"`
	UserPoolID string `env:"COGNITO_USER_POOL_ID,required,notEmpty"`
}

func APILoad() (*APIConfig, error) {
	cfg, err := env.ParseAs[APIConfig]()
	if err != nil {
		return nil, fmt.Errorf("parse api config: %w", err)
	}
	return &cfg, nil
}
