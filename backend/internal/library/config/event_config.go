package config

import (
	"fmt"

	"github.com/caarlos0/env/v11"
)

type EventConfig struct {
	App   EventAppConfig
	Store StoreConfig
}

type EventAppConfig struct {
	Env         Environment `env:"APP_ENV,required,notEmpty"`
	ServiceName string      `env:"EVENT_SERVICE_NAME,required,notEmpty"`
}

type StoreConfig struct {
	TableName string `env:"DYNAMODB_TABLE_NAME"`
}

func EventLoad() (*EventConfig, error) {
	cfg, err := env.ParseAs[EventConfig]()
	if err != nil {
		return nil, fmt.Errorf("parse event config: %w", err)
	}
	return &cfg, nil
}
